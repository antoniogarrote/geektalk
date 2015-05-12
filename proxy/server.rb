require 'sinatra'
require 'twitter'
require 'json'
require 'sinatra/cross_origin'

client = Twitter::REST::Client.new do |config|
  config.consumer_key        = "yM8OaxiurswPhmr2Tnugvg"
  config.consumer_secret     = "7CfdGlP8Nj672epm99fuboWbkDWXsYrBtLE1K5zFwVA"
  config.access_token        = "6713072-VCB8g4i35HYIaNQXDAhUrqr5cyyjJi2rPFguz7ZvgT"
  config.access_token_secret = "WM83OHIyNvWMBRBfb9b9kr9iIki0YDH9zlfRg5cfRg7Fr"
end

configure do
  enable :cross_origin
end

options "*" do
  response.headers["Allow"] = "HEAD,GET,PUT,POST,DELETE,OPTIONS"
  response.headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Cache-Control, Accept"
  200
end

get '/api.twitter.com/1.1/users/show.json' do
  cross_origin
  name = params['screen_name']
  res = client.user(name)
  res.to_h.to_json
end

set :server, 'webrick'
