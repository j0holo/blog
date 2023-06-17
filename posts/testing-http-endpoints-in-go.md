---
date: '2021-10-17'
title: Testing HTTP endpoints in Go
---

Go makes it really easy to test HTTP endpoints with the `httptest` package. Let's view this in an example and see how easy it is.

Our manager gave us a new task today. He gave us the following specifications:

- Every response must be of content-type: application/json
- The body of POST requests needs to written to disk for analysis later
- GET requests returns the content of the file if available
- If the file is not available we need to return a 404 Not Found

We start with the first bullet-point, starting with a test:

```go
package main

import "net/http"

func main() {

}

func newRouter() http.Handler {
	mux := http.NewServeMux()

	return mux
}
```
*main.go*

```go
package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestOnlyAcceptsApplicationJSONRequests(t *testing.T) {
	ts := httptest.NewServer(newRouter())
	defer ts.Close()

	resp, err := http.Get(ts.URL+"/json")
	if err != nil {
		t.Fatal("request returned and error:", err)
	}

	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("status code is not %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}
```
*main_test.go*

Running it with `go run .` , we get a 404 Not Found, as expected. An easy fix by adding a route, `/json`. `go run .` again and it works. Now we update the test to check for the content-type matches with `application/json`.

```go
...

func newRouter(app *Application) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/json", app.handleJSON)

	return mux
}

type Application struct {

}

func (a *Application) handleJSON(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	return
}
```
*main.go*

```go
...

func TestOnlyAcceptsApplicationJSONRequests(t *testing.T) {
	app := &Application{}
	ts := httptest.NewServer(newRouter(app))
	defer ts.Close()

	resp, err := http.Get(ts.URL+"/json")
	if err != nil {
		t.Fatal("request returned and error:", err)
	}

	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("status code is not %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}

	contentType := resp.Header.Get("content-type")
	if contentType != "application/json" {
		t.Errorf("response content-type is not application/json, got %s", contentType)
	}
}
```
*main_test.go*

One problem gone, three more to go.

## Writing files to disk

This one is actually a bit more difficult to test without leaving temporary files around. We could use `os.WriteFile` but that would make testing it more difficult and also leaves around the files we need to clean up after the test.

We have to write some abstraction to fake a os.File that we normally get from `os.OpenFile()`, fortunately `os.File` implements a `io.WriterCloser` which is similar to `bytes.Buffer` except that `bytes.Buffer` does not implement the `io.Closer` interface. By writing some extra code we can mimic writing to a file without creating a file. Let's see how that works.

```go
// In main.go we define the fileOpener interface

// fileOpener mimics the os.OpenFile but returns an io.WriteCloser instead.
type fileOpener interface {
	openFile(name string, flag int, perm os.FileMode) (io.WriteCloser, error)
}
```
*main.go - the new interface that we will be using*

```go
// In main.go we define the fileOpener interface

// fileOpener mimics the os.OpenFile but returns an io.WriteCloser instead.
type fileOpener interface {
	openFile(name string, flag int, perm os.FileMode) (io.WriteCloser, error)
}
```
*main_test.go - our test implementation for the fileOpener interface*

The `fileOpener` interface gives us the option to implement two versions, one for production and one for testing. `osFile.openFile` returns `os.File` which in turn implements the `io.WriterCloser` as already said earlier.

The `fakeFiles` and `fakeFile` structs are our second implementation that together simulate the filesystem and files in a `map[string]fakeFile` which is stored in the `fakeFiles` struct. Now we can read what the HTTP handler has written without creating a real file.

This has one problem, instead of testing behavior we are actually also testing the implementation of our handler. Which can make our tests fragile if we change our implementation without changing our behavior. 
This is a trade-off I'm willing to make right now. But always keep that in mind when your tests start digging into dependencies that your function/method need.

After using these interfaces our code now looks like this:

```go
package main

import (
	"io"
	"io/ioutil"
	"net/http"
	"os"
)

// fileOpener mimics the os.OpenFile but returns an io.WriteCloser instead.
type fileOpener interface {
	openFile(name string, flag int, perm os.FileMode) (io.WriteCloser, error)
}

type osFile struct {}

// openFile implements the fileOpener interface by returning an *os.File
// which implements the io.WriterCloser interface.
func (o osFile) openFile(name string, flag int, perm os.FileMode) (io.WriteCloser, error) {
	return os.OpenFile(name, flag, perm)
}

func main() {

}

func newRouter(app *Application) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/json", app.handleJSON)

	return mux
}

type Application struct {
	fs fileOpener
}

func (a *Application) handleJSON(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		w.Header().Add("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		return
	} else if r.Method == http.MethodPost {
		w.Header().Add("Content-Type", "application/json")

		filename := r.URL.Query().Get("file")
		fw, err := a.fs.openFile(filename, os.O_CREATE|os.O_APPEND, 0700)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer fw.Close()

		data, err := ioutil.ReadAll(r.Body)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer r.Body.Close()
		_, err = fw.Write(data)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusAccepted)
		return
	}

}
```
*main.go*

```go
package main

import (
	"bytes"
	"io"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

// fakeFile implements the io.WriterCloser interface.
type fakeFile struct {
	buff *bytes.Buffer
}

func (f fakeFile) Write(p []byte) (n int, err error) {
	return f.buff.Write(p)
}

func (f fakeFile) Close() error {
	return nil
}

// fakeFiles mimics the filesystem.
type fakeFiles struct {
	files map[string]fakeFile
}

func newFakeFiles() *fakeFiles {
	return &fakeFiles{
		files: make(map[string]fakeFile),
	}
}

func (ff *fakeFiles) openFile(name string, flag int, perm os.FileMode) (io.WriteCloser, error) {
	ff.files[name] = fakeFile{buff: bytes.NewBuffer([]byte{})}
	return ff.files[name], nil
}

func TestOnlyAcceptsApplicationJSONRequests(t *testing.T) {
	app := &Application{fs: newFakeFiles()}
	ts := httptest.NewServer(newRouter(app))
	defer ts.Close()

	resp, err := http.Get(ts.URL+"/json")
	if err != nil {
		t.Fatal("request returned and error:", err)
	}

	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("status code is not %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}

	contentType := resp.Header.Get("content-type")
	if contentType != "application/json" {
		t.Errorf("response content-type is not application/json, got %s", contentType)
	}
}

func TestWriteFileToDiskOnPostRequest(t *testing.T) {
	files := newFakeFiles()
	app := &Application{fs: files}
	ts := httptest.NewServer(newRouter(app))
	defer ts.Close()

	input := []byte("{\"secret\": \"true\"}")

	filename := "test.json"
	endpoint := ts.URL + "/json?file=" + filename
	resp, err := http.Post(endpoint, "application/json", bytes.NewReader(input))
	if err != nil {
		t.Fatal("request returned and error:", err)
	}

	if resp.StatusCode != http.StatusAccepted {
		t.Errorf("status code is not %d, got %d", http.StatusAccepted, resp.StatusCode)
	}

	written, err := ioutil.ReadAll(files.files[filename].buff)
	if err != nil {
		t.Errorf("cannot read file buffer: %v", err)
	}

	if !bytes.Equal(written, input) {
		t.Errorf("bytes written to file is not equal to input")
	}
}
```
*main_test.go*

## Reading files from disk

For reading files from disk I want to use a similar setup as we used with writing files to disk. The problem is, is that our `fileOpener` interface does not support reading. Changing it to support reading is fairly easy actually, but our interface needs to support the `io.ReadWriteCloser` interface.

This is a really easy change because `os.File` and `bytes.Buffer` already implement this interface. With a simple update to our `fileOpener` and implementing the `Write(p []byte) (n int, err error)` method for `fakeFile` we are already done to write our test.

```go
type fileOpener interface {
	openFile(name string, flag int, perm os.FileMode) (io.ReadWriteCloser, error)
}

type osFile struct {}

func (o osFile) openFile(name string, flag int, perm os.FileMode) (io.ReadWriteCloser, error) {
	return os.OpenFile(name, flag, perm)
}

// Our GET part of the HTTP handler.
func (a *Application) handleJSON(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		w.Header().Add("Content-Type", "application/json")

		filename := r.URL.Query().Get("file")
		if filename == "" {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		fr, err := a.fs.openFile(filename, os.O_RDONLY, 0700)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				w.WriteHeader(http.StatusNotFound)
				return
			}
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		buffer, err := io.ReadAll(fr)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		_, err = w.Write(buffer)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		return
    } // Our POST request part
```
*main.go - the changes in main.go*

```go
func (f fakeFile) Write(p []byte) (n int, err error) {
	return f.buff.Write(p)
}

...

func (ff *fakeFiles) openFile(name string, flag int, perm os.FileMode) (io.ReadWriteCloser, error) {
	if f, ok := ff.files[name]; ok {
    	// We don't want to overwrite our writen file.
		return f, nil
	}
	ff.files[name] = fakeFile{buff: bytes.NewBuffer([]byte{})}
	return ff.files[name], nil
}
```
*main_test.go - updating opeFile return values and implement the fakeFile.Write method*

Our test looks similar to the write test but instead we compare the response body to the bytes we put in the file.

```go
func TestReadJSONFileFromDisk(t *testing.T) {
	files := newFakeFiles()
	app := &Application{fs: files}
	ts := httptest.NewServer(newRouter(app))
	defer ts.Close()

	filename := "test.json"
	f, err :=files.openFile(filename, 1, 1)
	if err != nil {
		t.Fatal("can't write to test file", err)
	}
	fileData :=[]byte("{\"the_key\":\"is in this file\"}\n")
	_, err =f.Write(fileData)
	if err != nil {
		t.Fatal("can't write to test file", err)
	}

	endpoint := ts.URL + "/json?file=" + filename
	resp, err := http.Get(endpoint)
	if err != nil {
		t.Fatal("request returned and error:", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Errorf("status code is not %d, got %d", http.StatusOK, resp.StatusCode)
	}

	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		t.Errorf("can't get response body: %v", err)
	}
	defer resp.Body.Close()

	if !bytes.Equal(data, fileData) {
		t.Errorf("bytes read from file is not equal to input")
	}
}
```
*main_test.go - our test for reading JSON files from disk*

`go test`, PASS! Our last point is returning a 404 Not Found if the file does not exist. This is actually easy and a problem at the same time. Easy because we already check if `os.ErrNotExist` is returned. Difficult because our fake filesystem doesn't support that.

Lets fix our fakeFiles.openFile method.

```go
func (ff *fakeFiles) openFile(name string, flag int, perm os.FileMode) (io.ReadWriteCloser, error) {
	if f, ok := ff.files[name]; ok {
		return f, nil
	}
	if flag == os.O_RDONLY {
		if _, ok := ff.files[name]; !ok {
			return nil, os.ErrNotExist
		}
	}

	ff.files[name] = fakeFile{buff: bytes.NewBuffer([]byte{})}
	return ff.files[name], nil
}

...

func TestFileDoesNotExist(t *testing.T) {
	files := newFakeFiles()
	app := &Application{fs: files}
	ts := httptest.NewServer(newRouter(app))
	defer ts.Close()

	endpoint := ts.URL + "/json?file=not_here.json"
	resp, err := http.Get(endpoint)
	if err != nil {
		t.Fatal("request returned and error:", err)
	}

	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("status code is not %d, got %d", http.StatusNotFound, resp.StatusCode)
	}
}
```
*main_test.go - updating our fakeFiles.openFile method*

Our final task completed with a quick confirmation with `go test .`.

## Conclusion

That is it, we finished the tasks.

With the `httptest` package we incrementally added al the required behavior to the HTTP handler. By using dependency injection we the amount of cleanup we had to do while decreasing our coupling.

Note there are some problems that we haven't tackled yet.

- No logging at all
- We don't check our path, so reading and writing from/to config and secrets on our server is possible
- There is no upload limit
- No content validation

No worries, we can fix that in production, right? All jokes aside, I hope that this gives you an idea how to use the `httptest` package and use dependency injection to abstract away the interaction with the filesystem.