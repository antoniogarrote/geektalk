js_files = ["bootstrap-modal.js", "d3.js","rdf_store.min.js", "semko.min.js", "rdfstore_frontend.js", "macro.js", "apis.js", "geektalk.js"]

`rm -rf ./tmp`
`mkdir ./tmp`
`npm install uglify-js`

js_files.each do |f|
  if f.index(".min.")
    puts "* copying already minimized file #{f}"
    `cp src/#{f} ./tmp/`
  else
    puts "* minimizing file  #{f}"
    `cd ./tmp && ../node_modules/uglify-js/bin/uglifyjs ../src/#{f} > #{f} && cd ..`
  end
end


puts "* cleaning previous version"
`rm -f ./js/geektalk.dist.js`
js_files.each do |f|
  puts "** adding file #{f}"
  `cat ./tmp/#{f} >> ./js/geektalk.dist.js`
end

puts "* cleaning temporary directory"
`rm -rf tmp`
