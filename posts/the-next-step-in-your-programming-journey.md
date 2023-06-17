---
date: '2022-01-13'
title: The next step in your programming journey
---

In this post we take a look at how you progress from following tutorials and guides to writing your own programs or websites. Let's be honest, you will not get far if you keep following guides and tutorials on medium.com.

Maybe you have written already some small programs yourself, hangman, a guessing game, a simple CLI tool. But never a larger program that goes beyond what you have been learning. A reall challenge, but something you need to face to progress in your programming career.

Let me explain how you can tackle this problem. I'll take a fairly generic approach because I don't know what you want to program.

Step one, write down what you want to program, don't open your editor just yet. Get a piece of paper and write down what your program-to-be needs to do. Keep it simple, but challenge yourself. It could be a small website where you can upload pictures and create collections of pictures. Or a small CLI tool that automates some task.

Once you have decided what you want to program you need to work out what features it needs to have. Do you need accounts? Do you need to pass arguments to your application? What do those arguments do? What do you do in case there is an error when you want to write your calculations to a file?

For example if we continue with the image upload website we could write down the following features:

- Upload image
- Remove images
- Add a comment to an uploaded image
- Create/Update/View/Delete collections

Broadly speaking these are the features of our application. Each feature has challenges, the upload image for example. How do we upload images? What image formats do we support? Where do we store the image? Extracting these questions from a feature and answering them is important.

The more precise you are with your questions and answers the easier it is to know what to program or what to research. Google and scribble away. It creates a flow that you can follow while implementing the feature.

A flow could look like this:

1. Upload an image
1. Check if the image has a valid extension
1. Store the image
1. Return a response to the user

This already looks like pseudo-code `uploadImage(image)`, `checkExtension(image, validExtensions)`, `storeImage(image)`, etc. This is a skill that takes time to develop and in my opinion one of the important skills of a developer, breaking problems down into smaller pieces.

Now do this for all the features you have written down. Maybe this takes a couple of pages of paper. That is fine. Once you have everything on paper then you can start programming.

This might seem tedious and it actually is, but you probably don't have the skills and experience to tackle those problems straight from your favorite editor. If you get stuck: Google it. Doesn't Google help you? Try asking on a forum or on a programming Discord server. State your problem clearly and give relevant information. Again an important skill.

After a couple of days you finally have the upload function working, create collections and remove images. And now you are really stuck.

Does that mean you failed?

Ask yourself: what would I do different and can I do it better next time? If you can answer those two questions you did not fail. Progress! That is what those two answered questions mean. I have so many projects that are just a single file where I try a single thing. Once I'm done are bored I throw it away, knowing that I learned something. A new library, a new way to catch errors, whatever.