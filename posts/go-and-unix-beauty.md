---
date: '2024-08-21'
title: Go and Unix beauty
---

I enjoy programming in Go, but recently I was doing some frontend programming.

NPM has all these `watch` command that automatically rerun tasks when files are updated.

Neat, has Go something like that without installing some binary?

No, but Go's CLI does work nice with the Unix philosophy.

```
watch go test ./...
```

Every five seconds your tests of packages that have been changed will be tested.

So no wasted resources, no extra tooling required!

Just a need little trick.
