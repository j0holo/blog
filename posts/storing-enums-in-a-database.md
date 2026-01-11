---
date: '2025-01-11'
title: 'Storing enums in a database'
---

*This is a bit of a ramble about data-oriented design and enum storage in databases.*

*I see that there is a relation between data-oriented design and high performance
 web application, but I have difficulty expressing it.*

When working with Hibernate, Eloquent and other ORMs I often see that enums are 
stored as their string representation instead of a smaller value like an integer.

Comming back to the ideas data-oriented design which focusses on batching large 
arrays of data that fits well into the CPU caches.

Storing strings instead of integers is not cache friendly at all.

I was thinking how I could apply this to my own work. I don't work on game engines,
 high performance software. Instead I am a web developer, a *common* software engineering job.

Web frameworks like Spring, Django and Laravel and even the Go http server standard
 library do a lot of work for you already.

Parsing the HTTP request, sending the response. We only start to have control over
 our data in the handler or controller method.

What do we in a handler:

- valdiate and parse the input if any
- query the database based on the input
- return a response

Often the validation is on a small set of data.

- Is the uploaded file really a PDF?
- Is the name of the product within 250 characters?
- Is the set date in the future?

The response is often filling a HTML template or returning JSON. Protobuf and other
more performant JSON replacements are rarely used in my experience. Often handled
 by the framework. Returning a class that is transformed into JSON.

So that leaves us with the bulk of the data, the database. Obvious I know.
So if this is our space to apply data-oriented design?

I do think it is!

To see if this is indeed the place to think about keeping our data representation
 compact and thus cache friendly.

## Benchmark

After writing some [benchmark code](https://github.com/j0holo/sqlite-benchmark) I can maybe draw some conclusions.

Each table has 15 million rows, where the fk and int table share the same dataset.

- enum_as_string: 626 MB
- enum_as_fk: 396 MB
- enum_as_int: 396 MB

MySQL and Postgres can both have enum types that can be used for this purpose.
The point of this test is to see the impact of storing enums as strings.

My system:

- CPU: AMD Ryzen 5800X3D
- Memory: 32GB of DDR4 at 2666MT/s
- Storage: Crucial MX500 2TB

|                          Name                         | Mean (ms) | Median (ms) | StdDev (ms) |
|-------------------------------------------------------|-----------|-------------|-------------|
|                  enum_as_string_color                 |   0.751   |    0.734    |    0.063    |
|                    enum_as_fk_color                   |   0.789   |    0.788    |    0.012    |
|                   enum_as_int_color                   |   0.650   |    0.628    |    0.058    |
|###|###|###|###|
|                enum_as_string_color_in                |   0.742   |    0.733    |    0.028    |
|                  enum_as_fk_color_in                  |   0.798   |    0.784    |    0.051    |
|                  enum_as_int_color_in                 |   0.643   |    0.634    |    0.040    |
|###|###|###|###|
|            enum_as_string_color_and_status            |   0.845   |    0.791    |    0.098    |
|              enum_as_fk_color_and_status              |   1.029   |    1.007    |    0.107    |
|              enum_as_int_color_and_status             |   1.216   |    1.214    |    0.021    |
|###|###|###|###|
|     enum_as_string_color_and_status_and_order_type    |   1.577   |    1.497    |    0.251    |
|       enum_as_fk_color_and_status_and_order_type      |   1.305   |    1.221    |    0.244    |
|      enum_as_int_color_and_status_and_order_type      |   0.703   |    0.703    |    0.026    |
|###|###|###|###|
|   enum_as_string_two_negative_status_and_order_type   |  162.908  |   162.488   |    2.653    |
|     enum_as_fk_two_negative_status_and_order_type     |   0.945   |    0.946    |    0.006    |
|     enum_as_int_two_negative_status_and_order_type    |   0.651   |    0.652    |    0.005    |
|###|###|###|###|
| enum_as_string_todo_in_progress_status_and_order_type |   0.764   |    0.764    |    0.006    |
|   enum_as_fk_todo_in_progress_status_and_order_type   |   0.945   |    0.945    |    0.008    |
|   enum_as_int_todo_in_progress_status_and_order_type  |   0.647   |    0.647    |    0.007    |

## Conclusion

It is not as bad as I thought. Using indexes correctly for these simple queries helps a lot.

But string based enums can be really slow (160x slower) when you can't do a complete index 
lookup over the where clauses. For example:

`where status != 'FAILED' and status != 'COMPLETED' and order_type = 'ONLINE'`.

Which can be fixed by using `status in ('TODO', 'IN_PROGRESS')` clauses so the index
is used again. Status can be TODO, IN_PROGRESS, COMPLETED, FAILED.

It is not really that much slower when you use it for filtering, but it will increase
the size of your table and indexes.

Database design is not data-oriented design. The ideas and techniques talked about by
Casey Muratori, Andrwe Kelley and Mike Acton are difficult to apply in a web backend
landscape dominated by frameworks and HTTP libraries.

Yet their idea of storing the data in the smallest possible space does also
apply to database.