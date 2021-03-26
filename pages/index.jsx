import Head from 'next/head';
import styles from '../styles/Home.module.css';
import TextField from '@material-ui/core/TextField';
import ArrowRightAltIcon from '@material-ui/icons/ArrowRightAlt';
import React, { useState } from 'react';
import { Button, Paper, Divider } from '@material-ui/core';

const axios = require('axios');

var callUrl = async (departure, arrival) => {
  var requete = await axios({
    method: "GET",
    url: "http://localhost:3000/api/sncf2",
    headers: {
      "departure": departure,
      "arrival": arrival
    }
  })
  // console.log(requete,'ok');
  return requete
};
// await fetch ("http://localhost:3000/api/sncf2" + token.uid);

export default function Home() {
  const [departureCity, setdepartureCity] = useState('');
  const [arrivalCity, setarrivalCity] = useState('');
  const [itineraire, setitineraire] = useState({});
  const [etape, setetape] = useState([]);
  const [totaltime, settotaltime] = useState('');
  const [departureTime, setdepartureTime] = useState('');
  const [arrivalTime, setarrivalTime] = useState('');

  var getData = async () => {
    var mydata = await callUrl(departureCity, arrivalCity);
    console.log(mydata.data, 'ok');
    setitineraire(mydata.data.itineraire[0]);
    settotaltime(convertmyDate(mydata.data.itineraire[0].totalDuration));
    setdepartureTime(transformDate(mydata.data.itineraire[0].departureTime));
    setarrivalTime(transformDate(mydata.data.itineraire[0].arrivalTime));
    setetape(mydata.data.step.sort(compare));
  };

  var convertmyDate = (mydate) => {
    var measuredTime = new Date(null);
    measuredTime.setSeconds(parseInt(mydate));
    var MHSTime = measuredTime.toISOString().substr(11, 8);
    return MHSTime;
  }
  var transformDate = (mydate) => {
    let tette = mydate[6] + mydate[7] + "/" + mydate[4] + mydate[5] + "/" + mydate[0] + mydate[1] + mydate[2] + mydate[3] + " " + mydate[9] + mydate[10] + ":" + mydate[11] + mydate[12];
    return tette;
  }

  function compare(a, b) {
    let comparison = 0;
    if (a.order > b.order) {
      comparison = 1;
    } else if (a.order < b.order) {
      comparison = -1;
    }
    return comparison;
  }


  return (
    <div>
      <Paper elevation={5} style={{ width: '80%', margin: 'auto', padding: '1px 0 10px 0', marginTop: '10px' }}>
        <h1 style={{ textAlign: 'center' }}>Calculez votre itinéraire</h1>
        <div className={styles.wrapper} style={{ marginTop: '30px' }}>
          <div style={{ margin: 'auto' }}>
            <TextField
              label="Ville de départ"
              variant="outlined"
              style={{ marginRight: '30px' }}
              color="primary"
              onChange={(e) => setdepartureCity(e.target.value)} />
            <ArrowRightAltIcon style={{ fontSize: 55 }} color="primary" />
            <TextField
              label="Ville d'arrivée"
              variant="outlined"
              style={{ marginLeft: '30px' }}
              color="primary"
              onChange={(e) => setarrivalCity(e.target.value)} />
          </div>
        </div>
        <Button
          color="primary"
          variant="contained"
          style={{ margin: 'auto', display: 'flex', marginTop: '20px', width: '40%' }}
          onClick={async () => { getData() }}>
          C'est parti
        </Button>
      </Paper>
      <div style={{ width: '80%', margin: 'auto' }}>
        <Paper elevation={5} style={{ width: '35%', float: 'left', padding: '1px 0 10px 0', marginTop: '10px' }}>
          <h1 style={{ textAlign: 'center' }}>Résumé du trajet</h1>
          <div style={{marginLeft:'10px'}}>
            <p>Ville de départ : {itineraire.cityDepart}</p>
            <p>Heure de départ : {departureTime}</p>
            <p>Météo au départ : {itineraire.cityDepartMeteo}</p>
            <p>Ville d'arrivée' : {itineraire.cityArrive}</p>
            <p>Heure d'arrivée : {arrivalTime}</p>
            <p>Météo à l'arrivée : {itineraire.cityArriveMeteo}</p>
            <p>Temps de trajet total : {totaltime}</p>
            <p>Nombre de changements : {itineraire.transfer}</p>
            <p>Emission de CO2 : {itineraire.co2emisson}</p>
          </div>
        </Paper>
        <Paper elevation={5} style={{ width: '64%', marginLeft: '1%', float: 'left', padding: '1px 0 10px 0', marginTop: '10px' }}>
          <h1 style={{ textAlign: 'center' }}>Liste des étapes</h1>
          {etape.map(({ cityStart, cityDepartureTime, cityEnd, cityArrivalTime, description }, index) => (
            <div>
              <div style={{marginLeft:'10px'}}>
                <p style={{ color: 'blue' }}>Trajet {index + 1}</p>
                <p>De {cityStart} jusqu'à {cityEnd}</p>
                <p>{description}</p>
                <p>Heure de départ : {transformDate(cityDepartureTime)}, heure d'arrivée : {transformDate(cityArrivalTime)}</p>
              </div>
              <Divider />
            </div>

          ))}
        </Paper>
      </div>


    </div>
  )
}
