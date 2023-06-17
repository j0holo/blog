---
date: '2021-10-10'
title: Behavior Driven Development and boundaries
---

TDD (Test Driven Development) and BDD (Behavior Driven Development) is all the rage these days but on various subreddits and news.ycombinator.com there are people who love it and people who think it is nonsense. I struggled a lot with these two concepts. But I think I have found something that works for me.

Around 5 years ago I wrote my first real website in [Python with Flask](https://github.com/j0holo/simple_blog). It worked quite well, but I feared touching any code at all. It could break at any moment and I had no clue why it would break.

As you can see in the [Github repository](https://github.com/j0holo/simple_blog) it doesn't have any test. My development environment at the time consisted of a text editor on the left (Atom was all the rage if I'm not mistaken) and a web browser windows and the right. "Change some code. Hit f5, test it. Change more code. etc".

This took a tremendous amount of time to debug errors. Maybe this TDD thing can help me I thought.

Reading lots of medium.com articles, beginner guides that apply TDD to a calculator were useless in applying TDD/BDD to a HTTP JSON API server.

One of the first two pages that really helped me were from Dan North, [Introducing BDD](https://dannorth.net/introducing-bdd/) and [What is in a story](https://dannorth.net/whats-in-a-story/). Which in turn turned me towards Cucumber a tool/framework for running behavior driven tests in the Given/When/Then style. Cucumber works really well for a couple of small tests but becomes an obstacle once your application grows. This is at least the case with Go and it's cucumber library. It forces you to place your test Go files that test the Gherkin specifications you wrote in the root directory of your project. Which in not Go like at all.

After more searching I finally found three blog posts that helped me understand how to apply TDD and BDD to my projects:

- [https://bhserna.com/while-doing-tdd-on-a-use-case-you-will-create-classes-and-methods-that-you-dont-need-to-test-directly.html](https://bhserna.com/while-doing-tdd-on-a-use-case-you-will-create-classes-and-methods-that-you-dont-need-to-test-directly.html)
- [https://bhserna.com/a-simple-way-to-organize-your-app-in-use-cases.html](https://bhserna.com/a-simple-way-to-organize-your-app-in-use-cases.html)
- [https://www.tedinski.com/2019/03/19/testing-at-the-boundaries.html](https://www.tedinski.com/2019/03/19/testing-at-the-boundaries.html)

The last post from Ted Kaminski solved the mystery for me. Tests are not about functions, methods, or classes, they are about behavior. I highly recommend you to read Ted's post first before you continue to finish this one. And good non-fragile tests are tests that focus on boundaries. But what are those boundaries and how can you find the boundaries in your application.

## Boundaries

Lets say we have an HTTP API with a database and some queue processing. You can divide this application in a couple of components, which are not all boundaries.

- The HTTP API server and it's handlers/routes
- The business logic of your application used by your routes
- The database layer which can be functions that use plain SQL or an ORM
- Some sort of queue worker package that picks up item from the queue

A normal HTTP request will hit the following components:

```text
HTTP API -> business logic -> database layer                              
                \-> put work on queue -> queue worker
```

How much functionality can we test via the HTTP API? Quite a lot because our HTTP API uses our business logic which in turn uses our database layer.

Knowing that your application can be tested via the HTTP API you don't need to write tests for your business logic or database layer. There are exceptions of course. From languages or frameworks that don't have good support for testing HTTP endpoints ([Go's excellent httptest package](https://pkg.go.dev/net/http/httptest)) you could focus your tests on the business logic instead. And keep your HTTP API layer minimal with just templating and/or marshaling JSON.

The queue worker is harder to test and independent of the business logic. They share the messages via a queue but that is about it. So the coupling is loose. Which indicates that the queue worker is a new boundary that we can focus our tests on.

Adding a storage layer or a new queue worker type doesn't have impact on our tests for the HTTP API. We can keep our tests the same if the behavior stays the same. And they should pass even if we add a *updated_at* timestamp in our _UpdateUser()_ function in the database layer.

## Conclusion

By identifying boundaries in your application and putting the right tests on those boundaries you test behavior without brittle tests if you change or add some logic in the underlying layers.

This takes time and practice to get this right. Sometimes TDD or BDD just doesn't fit, the GUI for example. They are just tools that you can use to give you more confidence in the software you are building.

p.s. Another good post from Ted Kaminski [https://www.tedinski.com/2018/11/27/contradictory-tdd.html](https://www.tedinski.com/2018/11/27/contradictory-tdd.html)