---
date: '2022-05-20'
title: The bright future of embedded databases
---

Personally I think that embedded databases have a bright future ahead. Let me explain.

Client-server databases are dominating the current database landscape. Self-hosted, managed (AWS RDS, GCP Cloud SQL) or DBaaS (Snowflake) are popular. No doubt about it.

Managed databases or DBaaS are expensive but offer a tradeoff for smaller companies to have a reliable database with backups and recovery included without the need of having a dedicated employee for database management.

The thing is, embedded databases are easy to manage. SQLite with it's .backup command or [Litestream](https://litestream.io/) can do live backups and is easy to recover.

The thing is that embedded databases are most of the time one file and with the right support provided by the database backups become trivial (with the right tooling/API). Most companies don't have a lot of data, 10-100 GB.

With the rise of Intel Optane and large CPU caches the benefit pushes more and more to embedded databases. Yes, networks get faster and Intel Silicon Photonics looks promising providing over 1.6 Tbps. But I don't think networks will be faster then memory and caches. Those network bits and bytes still need to be stored somewhere waiting to be processed by the CPU/GPU.

When you can get 128 CPU cores with terabytes of RAM you can handle a LOT of requests. Expensify already [showed in 2018](https://blog.expensify.com/2018/01/08/scaling-sqlite-to-4m-qps-on-a-single-server/) that with some solid hardware and minor tweaks to SQLite that 4 million queries per second is possible with SQLite.

Postgresql and MariaDB will still get plenty of use, but embedded databases will be seen as a solid alternative for many applications in the future.