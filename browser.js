var init = window.location.hash.length 

var ssb = require('secure-scuttlebutt')
var defaults = require('secure-scuttlebutt/defaults')
var memdb = require('memdb')
var level = require('level-sublevel/bytewise')


var db = level(memdb(), {valueEncoding: defaults.codec})
var butt = ssb(db, defaults)

var me = butt.createFeed()

var peers = require('./peer')

var sockethub = require('../signalplex')

var hub = sockethub('ws://localhost:11010', 'meow')

var pipe = hub.subscribe(me.id)

var other = hub.subscribe('others')
var others = {}

// entre vous
hub.broadcast('others', me.id)
console.log(me.id.length)
pipe.on('error', function(e){console.log(e)})
pipe.on('data', function(data){
  data = JSON.parse(data.toString())
  var from = others[data.from]
  console.log(from, data)
  if(!from){
  
    var call = data.offer
    var opts = {}
    opts.which ='digital'
    opts.init = false
    peers.answer(call, function(e, p, o){
      others[data.from] = {peer: p}
      
      var reply = {from: me.id, offer: o}
      console.log('reply', reply)
      
      hub.broadcast(data.from, reply)
    
    })
  }else{
    from.peer.signal(data.offer)
  }
})

// this happens when a new entity joins
other.on('data', function(id){
  id = JSON.parse(id.toString())
  if(!(id === me.id)) {
    
  console.log(id)
    var opts = {}
    opts.init = true
    opts.which = 'digital' // else 'manual'
    
    peers.initiate(opts, function(e, p, o){
      console.log('peer init' + id + '\n', e,p,o)
      others[id] = {init:true}
      others[id].peer = p
      var offer = {from: me.id}
      offer.offer = o
      hub.broadcast(id, offer)
    })
  }
})

var dnd = require('drag-drop/buffer')
var customEv = require('custom-event')
dnd(document.body, peers.handleDrop)


