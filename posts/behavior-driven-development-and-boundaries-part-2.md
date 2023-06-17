---
date: '2021-10-10'
title: Behavior Driven Development and boundaries part 2
---

Lets see how effective testing at boundaries really is in terms of covering our code. I recommend reading [part 1 of this series](/posts/behavior-driven-development-and-boundaries/) first if you haven't done so already.

I created a [GitHub repository](https://github.com/j0holo/testing-boundaries) with a small HTTP API that adds new subscribers to a database. There is also a worker that reads emails from a queue and writes them to a [io.Writer](https://pkg.go.dev/io#Writer). An io.Writer is an interface that is automatically implemented if a struct  has the method `Write(p []byte) (int, error)`. In the future we can use this interface to write to S3 storage and mock it during our tests. Which we have done in this case.

Note that we only have tests that run against the `jsonHandler` endpoint and tests that put messages in the queue for the worker. These are our boundaries.

| filename | coverage % |
|---|---|
| business.go | 92.3% |
| database.go | 100% |
| main.go | 0% |
| routes.go | 78.1% |
| worker.go | 85.7% |

Look at our test coverage, 92.3% and 100% coverage on files we never tested directly. We can send more messages on queues or do more validation for our input and our old tests would still pass as long as the new code doesn't change our current tested behavior. Adding a `created_at` field to our `subscribers` table? It doesn't change our tests, because it doesn't change the behavior.

If it does the behavior does change, it is a sign that the behavior of the API changes. Do we want that? If yes, update the test. If no, update the code to make the tests pass.

See the [add-created_at-column branch](https://github.com/j0holo/testing-boundaries/tree/add-created_at-column) to see that I added a `created_at` column to the `subscribers` table and updated the business logic. All tests pass without any changes.

The more tests we add, the more rigid our API becomes. Especially for public APIs this can be a good thing. You will probably release a new API version for your customers if you make any API changes.

For internal APIs it means a lot more tests break if you change the behavior of your API. A signal that you are changing the contract other application depend on. If other applications are also changing this is not a problem. Our if your protocol supports backwards compatibility like gRPC it may also not be a problem.

Something to keep an eye on and balance. I think it is better to go overboard with tests and back off then have a pile of complex code with only one or two tests.