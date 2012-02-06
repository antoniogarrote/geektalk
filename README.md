# Geektalk

Geektalk is a small demo of how RDF can be used in a JS application to easily integrate data from different APIs.

A deployed version of the app can be found [here](http://antoniogarrote.com/geektalk/).

Geektalk is built using a number of libraries we have developed to make the use of RDF and other semantic technologies in JS easier:

- [RDFStore-JS](https://github.com/antoniogarrote/rdfstore-js)
- [SemanticKO](https://github.com/antoniogarrote/semantic-ko)
- [JSON-LD Macros](https://github.com/antoniogarrote/json-ld-macros)

All these libraries are free software and can be cloned and modified from their Github repositories.

To use the application just get the code and open *index.html* in a (modern) browser.

## Build

A ruby file named *build.rb* can be used to minify and join all the JS files in the application for a more convenient deployment. To execute this script, simply run:

    $ ruby ./build.rb
	
The files can also be included from the *src* directory in development. Check the comment in the *head* HTML tag at the top of *index.html*


## License

Licensed under the GPLv3 license, (c) Antonio Garrote <antoniogarrote@gmail.com> 2012
