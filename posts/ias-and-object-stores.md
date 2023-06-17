---
date: '2022-07-23'
title: IaS and object stores
---

The current trend of YAML based IaS (Ansible, SaltStack, K8s, and Helm) is not really development friendly.

YAML is a complicated specification ([https://github.com/cblp/yaml-sucks](https://github.com/cblp/yaml-sucks)) and it is easy to make mistakes in. It also isn't typed or helps you in any way. Good luck writing a k8s deployment/service/ingress without an auto-complete plugin (that doesn't understand context) or documentation.

Languages like [Dahl](https://dhall-lang.org/) do help a bit, but the last time I used it it took 15 minutes just to download the k8s validation code. Maybe that is saying something about more about k8s then Dahl.

Another contender in this space is [Cue](https://cuelang.org/) which validates, defines and processes a specification that you can write yourself.

The thing is, once a program reads it's configuration it is stored in objects, structs, and hash table. And there are clear rules on what is allowed and not allowed. The program has rules which combination of configuration is exclusive.

So why not move this validation logic to the IaS side. Using a static language that generates configuration based on known valid building blocks. This can be any language as long as it can give the developer clues on what is and isn't allowed.

The programs that generate configuration files would be called generators and be provided by the software community at large or by the developer of the software in question.

Object stores are used as storage for these configuration files and other files (binaries) that should be installed on the server.

An object could be located in the <hostname> bucket and be named /etc/myapp/myapp.conf and contains additional metadata for ownership and read/writes/execute octal.

The server in turn has a small clients which watches this bucket and keep track of what should and should not exist. This can be a small SQLite database. If a file doesn't exist in the object stored and used to be managed by the client, it should deleted.

One issue is of course adoption. A bit of a chicken and egg problem. I don't know how to solve this really.

The second issue is how do you get the credentials on the server. Does each server need its own credentials for improved security. How about encryption. You don't want config files with API keys unencrypted in a object store, right?

Maybe with something like cloud-init? A keyvault (Azure, Hashicorp). But those also need config, would you use traditional configuration management to configure those? Or maybe a prebuild images with a key to get it's actual private key for decryption.

Maybe accepting vendor lock-in and using their dedicated API to manage your DBs, VMs, object stores, etc. is the way to go for smaller business.

This is just an idea I'm throwing out there. I guess YAML will stay dominant for a while before the next generation of configuration management moves in. Hopefully it is more sane.