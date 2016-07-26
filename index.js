'use strict';

var PokemonGO = require('pokemon-go-node-api');
var request = require('request');
var _ = require('lodash');

var a = new PokemonGO.Pokeio();

var location = {
  type: 'name',
  name: process.env.PGO_LOCATION,
};

var username = process.env.PGO_USERNAME;
var password = process.env.PGO_PASSWORD;
var provider = process.env.PGO_PROVIDER || 'google';

var pokeMap;

a.init(username, password, location, provider, function(err) {
  if (err) throw err;

  console.log('1[i] Current location: ' + a.playerInfo.locationName);
  console.log('1[i] lat/long/alt: : ' + a.playerInfo.latitude + ' ' + a.playerInfo.longitude + ' ' + a.playerInfo.altitude);

  a.GetProfile(function(err, profile) {
    if (err) throw err;

    console.log('1[i] Username: ' + profile.username);
    console.log('1[i] Poke Storage: ' + profile.poke_storage);
    console.log('1[i] Item Storage: ' + profile.item_storage);

    var poke = 0;
    if (profile.currency[0].amount) {
      poke = profile.currency[0].amount;
    }

    console.log('1[i] Pokecoin: ' + poke);
    console.log('1[i] Stardust: ' + profile.currency[1].amount);


    setInterval(function() {

      a.Heartbeat(function (err,hb) {
        if(err) {
          console.error(err);
        }

        for (var i = hb.cells.length - 1; i >= 0; i--) {
          if(hb.cells[i].WildPokemon[0]) {

            var wildPokemon = hb.cells[i].WildPokemon;

            for (var j = wildPokemon.length - 1; j >= 0; j--) {
              var pokeId = wildPokemon[j].pokemon.PokemonId;
              var pokemon = a.pokemonlist[parseInt(pokeId)-1];

              var pokemonAlreadyPresent = _.some(pokeMap, function(poke) {
                return poke.id === pokeId;
              });

              if (!pokemonAlreadyPresent) {
                var latitude = wildPokemon[j].Latitude;
                var longitude = wildPokemon[j].Longitude;

                var message = 'There is a ' + pokemon.name + ' nearby! Map: https://www.google.co.uk/maps/@' + latitude + ',' + longitude + ',14z?hl=en';
                console.log(pokemon.name + ' detected');

                request.post({
                  url: process.env.SLACK_WEBHOOK_URL,
                  json: true,
                  body: {
                    text: message,
                    icon_url: pokemon.img
                  }
                }, function(error, response, body) {
                  console.error(error);
                  console.log(response.body);
                });
              } else {
               console.log(pokemon.name + ' already present: skipping');
              }
            }

            pokeMap = _.map(wildPokemon, function(poke) {
              return {
                id: poke.pokemon.PokemonId
              };
            });
          }
        }

      });
    }, 60000);

  });
});
