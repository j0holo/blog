---
date: '2024-05-29'
title: Space-time trade-off
---

Today I did some regex check on a string of text.

The regexes are dynamic based on a table in the database. In total there are around 200 different regexes, sometimes looking for a single word sometimes for a combination of words.

If any of the 200 regexes matches with the input string true is returned, otherwise false.

</br>

<details>

  <summary>Code</summary>

```go
package regex_bench

import (
	"fmt"
	"regexp"
)

func checkForMatch(regexes []*regexp.Regexp, input string) bool {
	for _, regex := range regexes {
		if regex.FindString(input) == "" {
			return true
		}
	}
	return false
}

func calculateRegexes() []*regexp.Regexp {
	var regexes = make([]*regexp.Regexp, len(wordList))
	for i := range wordList {
		regex, err := regexp.Compile(fmt.Sprintf("^.*\b%s\b.*$", wordList[i]))
		if err != nil {
			return nil
		}
		regexes[i] = regex
	}
	return regexes
}

// A string slice with 200 entries of "word <integer between 1 and 200>".
```
  
</details>

</br>

<details>

  <summary>The benchmark code</summary>

```go
package regex_bench

import "testing"

func BenchmarkNoPreCompute(b *testing.B) {
	b.Run("early match", func(b *testing.B) {
		var foundMatch bool
		const input string = "This is a string with the word 2."

		for i := 0; i < b.N; i++ {
			foundMatch = checkForMatch(calculateRegexes(), input)
		}
		if !foundMatch {
			b.Error("match should be found")
		}
	})

	b.Run("middle match", func(b *testing.B) {
		var foundMatch bool
		const input string = "This is a string with the word 100."

		for i := 0; i < b.N; i++ {
			foundMatch = checkForMatch(calculateRegexes(), input)
		}
		if !foundMatch {
			b.Error("match should be found")
		}
	})

	b.Run("late match", func(b *testing.B) {
		var foundMatch bool
		const input string = "This is a string with the word 199."

		for i := 0; i < b.N; i++ {
			foundMatch = checkForMatch(calculateRegexes(), input)
		}
		if !foundMatch {
			b.Error("match should be found")
		}
	})
}

func BenchmarkPreCompute(b *testing.B) {
	regexes := calculateRegexes()
	b.Run("early match", func(b *testing.B) {
		var foundMatch bool
		const input string = "This is a string with the word 2."

		for i := 0; i < b.N; i++ {
			foundMatch = checkForMatch(regexes, input)
		}
		if !foundMatch {
			b.Error("match should be found")
		}
	})

	b.Run("middle match", func(b *testing.B) {
		var foundMatch bool
		const input string = "This is a string with the word 100."

		for i := 0; i < b.N; i++ {
			foundMatch = checkForMatch(regexes, input)
		}
		if !foundMatch {
			b.Error("match should be found")
		}
	})

	b.Run("late match", func(b *testing.B) {
		var foundMatch bool
		const input string = "This is a string with the word 199."

		for i := 0; i < b.N; i++ {
			foundMatch = checkForMatch(regexes, input)
		}
		if !foundMatch {
			b.Error("match should be found")
		}
	})
}
```

</details>

</br>

Now for the benchmark results, each test has the same 200 regexes with matches three possible matches at the beginning, middle and end of the regex slice.

```bash
go test -bench=.
goos: linux
goarch: amd64
pkg: regex_bench
cpu: AMD Ryzen 7 5800X3D 8-Core Processor           
BenchmarkNoPreCompute/early_match-16         	    1584	   1010451 ns/op
BenchmarkNoPreCompute/middle_match-16        	    1161	    992859 ns/op
BenchmarkNoPreCompute/late_match-16          	    1232	   1046991 ns/op
BenchmarkPreCompute/early_match-16           	 2436992	       482.5 ns/op
BenchmarkPreCompute/middle_match-16          	 2315199	       509.2 ns/op
BenchmarkPreCompute/late_match-16            	 2328488	       499.1 ns/op
PASS
ok  	regex_bench	9.402s
```

This is of course an obvious benchmark but why would you even do this optimization? 500ns is quick but 1046991ns doesn't sound slow. Until you convert it to milliseconds:

> 1046991ns ~= 1.04ms

With a 100 requests a second that is still not a lot of time. What if the list grows and you need to build a 1000 regexes each request for a 1000 requests per second? Maybe it does matter, maybe it doesn't.

Keep it in the back of your mind: can I precompute this? If yes: Is it worth it in speed and readability?