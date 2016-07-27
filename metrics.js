'use strict';

var fs = require('fs');
var dataFilePath = process.env.PGO_DATA || ".data";
var dataset = loadDataSet();

function shouldReport(encounter,pokemon,distance){
  var name = pokemon.name;
  if ( ! dataset[name] ){
    dataset[name] = { sensitivity:100, lastSeen:Date.now() };
    triggerSaveDataSet();
    return true;
  }else{
    updateSensitiveity( dataset[name] );
    if ( dataset[name].sensitivity < distance ){ 
      dataset[name].sensitivity = dataset[name].sensitivity * 0.75;
      triggerSaveDataSet();
      return true;
    }else{
      return false;
    }
  }
}

function loadDataSet(){
  try{
    return JSON.parse(fs.readFileSync( dataFilePath , 'utf8' ));
  }catch(e){
    console.log(e);
    return {};
  }
}

var saveTimeoutId;
function triggerSaveDataSet(){
  if ( !saveTimeoutId ){
    saveTimeoutId = setTimeout( saveDataSet , 1000 );
  }
}

function saveDataSet(){
  saveTimeoutId = null;
  fs.writeFile( dataFilePath , JSON.stringify(dataset) )
}

function updateSensitiveity( item ){
  var timeDelta = Date.now() - item.lastSeen;
  item.sensitivity += timeDelta / (1000*60);
}

module.exports = {
  shouldReport:shouldReport
}
