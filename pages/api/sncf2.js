
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const jsonld = require('jsonld');
const axios = require('axios');
const fs = require('fs');
var qs = require('querystring');
const bodyParser = require('body-parser');
const express = require('express')


export default async (req, res) => {

    console.log(req.headers.departure)
    console.log(req.headers.arrival)
    let departureCity =req.headers.departure;
    let arrivalCity =req.headers.arrival;
    let trains = []
    let steps = []

    var FormatTrain = (response,meteo1,meteo2) => {
        // response = JSON.parse(response);
        let transfer = response.data.journeys[0].nb_transfers;
        let totalDuration = response.data.journeys[0].durations.total;
        let departureTime = response.data.journeys[0].departure_date_time;
        let arrivalTime = response.data.journeys[0].arrival_date_time;
        let co2emisson = response.data.journeys[0].co2_emission.value;
        let cityDepart = meteo1.data.city.name;
        let cityDepartMeteo = meteo1.data.forecast[0].weather;
        let cityArrive = meteo2.data.city.name;
        let cityArriveMeteo = meteo2.data.forecast[0].weather;
        console.log(cityDepartMeteo)
        console.log(cityArriveMeteo)
        // let cityArrival ;
        let train = {"transfer":transfer,
            "totalDuration":totalDuration,
            "departureTime":departureTime,
            "arrivalTime":arrivalTime,
            "cityDepart":cityDepart,
            "cityDepartMeteo":cityDepartMeteo,
            "cityArrive":cityArrive,
            "cityArriveMeteo":cityArriveMeteo,
            "co2emisson":co2emisson};
        trains.push(train);
        let i = 0;
        let cityStart;
        let cityEnd;
        let cityDepartureTime;
        let cityArrivalTime;
        let description;
        let txtTransport;
        let order;
        let j = 1;
        for(i=0; i<response.data.journeys[0].sections.length; i++){
            if(typeof response.data.journeys[0].sections[i].from !== 'undefined' && typeof response.data.journeys[0].sections[i].to !== 'undefined'){
                if(typeof response.data.journeys[0].sections[i].from.name !== 'undefined' && typeof response.data.journeys[0].sections[i].to.name !== 'undefined'){
                    if(response.data.journeys[0].sections[i].type=="public_transport"){
                        if(response.data.journeys[0].sections[i].from.name == ""){
                            cityStart = response.data.journeys[0].sections[i].from.stop_point.stop_area.name;
                        }
                        else {
                            cityStart = response.data.journeys[0].sections[i].from.name;   
                        }
                        cityDepartureTime = response.data.journeys[0].sections[i].departure_date_time;
                        if(response.data.journeys[0].sections[i].to.name == ""){
                            cityEnd = response.data.journeys[0].sections[i].to.stop_point.stop_area.name;
                        }
                        else {
                            cityEnd = response.data.journeys[0].sections[i].to.name;
                        }
                        cityArrivalTime = response.data.journeys[0].sections[i].arrival_date_time
                        txtTransport = response.data.journeys[0].sections[i].display_informations;
                        description = txtTransport.network + " " + txtTransport.code + " direction : "+ txtTransport.direction;
                        let mystation = {"cityStart":cityStart,
                            "cityDepartureTime":cityDepartureTime,
                            "cityEnd":cityEnd,
                            "cityArrivalTime":cityArrivalTime,
                            "description":description,
                            "order": j,
                             }
                        steps.push(mystation)
                        j = j+1;
                    }
                }
            }
        }
    };

    var callMeteo = async(code) => {
        var requete = await axios({
            method: "GET",
            url: "https://api.meteo-concept.com/api/forecast/daily?token=95a5d07991864cf75c98299e83815cc39b2d5f2378bcffcf4b12d8cea457d47e&insee="+code,
            })
        // console.log(requete,'ok');
        return requete;
    }

    var callUrl = async () => {
    // console.log("https://api.sncf.com/v1/coverage/sncf/journeys?from=admin:fr:"+departureCity+"&to=admin:fr:"+arrivalCity+"&datetime=20210326T082436")
    var now = new Date();
    var annee = String(now.getFullYear());
    if(now.getMonth()<10){
      var mois = "0"+String(now.getMonth() + 1);
    }
    else{
      var mois = String(now.getMonth() + 1);
    }
    if(now.getDate()<10){
      var jour = "0"+String(now.getDate());
    }
    else{
      var jour = String(now.getDate());
    }
    if(now.getHours()<10){
        var heure = "0"+String(now.getHours());
      }
    else{
        var heure = String(now.getHours());
      }
    if(now.getMinutes()<10){
        var minute = "0"+String(now.getMinutes());
      }
    else{
        var minute = String(now.getMinutes());
      }
    if(now.getSeconds()<10){
        var seconde = "0"+String(now.getSeconds());
      }
    else{
        var seconde = String(now.getSeconds());
      }
    var finalDateRequest = annee+mois+jour+"T"+heure+minute+seconde;
    console.log(finalDateRequest);
    var requete = await axios({
        method: "GET",
        url: "https://api.sncf.com/v1/coverage/sncf/journeys?from=admin:fr:"+departureCity+"&to=admin:fr:"+arrivalCity+"&datetime="+finalDateRequest,
        // url: "https://api.sncf.com/v1/coverage/sncf/journeys?from=admin:fr:94033&to=admin:fr:29019&datetime=20210326T082436",
        headers: {
            "Authorization": "8b6d8595-1d9a-4847-9d6e-8b726f2b240e"
        }
        })
    // console.log(requete,'ok');
    return requete
    };


    var getDataresponse = async () => {
        const response = await callUrl();
        const meteo1 = await callMeteo(departureCity);
        const meteo2 = await callMeteo(arrivalCity);
        // console.log(response,"test");
        FormatTrain(response,meteo1,meteo2);
        return [trains,steps];
    };

    var sparkRequest = async () => {
        var q = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        PREFIX stations: <http://www.owl-ontologies.com/etape.owl/>
        PREFIX it: <http://www.influencetracker.com/ontology#>
        PREFIX st: <http://ns.inria.fr/sparql-template/>
        PREFIX tr: <http://www.thomsonreuters.com/>
    
        SELECT DISTINCT ?cityStart ?cityDepartureTime ?cityEnd ?cityArrivalTime ?description ?order
        WHERE{
        ?Test stations:cityStart ?cityStart .
        ?Test stations:cityDepartureTime ?cityDepartureTime .
          ?Test stations:cityEnd ?cityEnd .
          ?Test stations:cityArrivalTime ?cityArrivalTime .
          ?Test stations:description ?description .
          ?Test stations:order ?order .
        }
    
        limit 25`;
        var requeteSpark = await axios({
            method: "POST",
            url: "http://localhost:3030/firstdf/query",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            },
            data: qs.stringify({ query: q })
            });
        return requeteSpark;
    }

    var sparkRequest2 = async () => {
        var q = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        PREFIX stations: <http://www.owl-ontologies.com/itineraire.owl/>
        PREFIX it: <http://www.influencetracker.com/ontology#>
        PREFIX st: <http://ns.inria.fr/sparql-template/>
        PREFIX tr: <http://www.thomsonreuters.com/>
    
        SELECT DISTINCT ?transfer ?totalDuration ?departureTime ?arrivalTime ?co2emisson ?cityDepart ?cityDepartMeteo ?cityArrive ?cityArriveMeteo
        WHERE{
        ?Test stations:transfer ?transfer .
        ?Test stations:totalDuration ?totalDuration .
          ?Test stations:departureTime ?departureTime .
          ?Test stations:arrivalTime ?arrivalTime .
          ?Test stations:co2emisson ?co2emisson .
          ?Test stations:cityDepart ?cityDepart .
          ?Test stations:cityDepartMeteo ?cityDepartMeteo .
          ?Test stations:cityArrive ?cityArrive .
          ?Test stations:cityArriveMeteo ?cityArriveMeteo .
        }
    
        limit 25`;
        var requeteSpark = await axios({
            method: "POST",
            url: "http://localhost:3030/firstdf/query",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            },
            data: qs.stringify({ query: q })
            });
        return requeteSpark;
    }


    async function main(){
        const stat = await getDataresponse()
        const myjson = {
            "@context": {
            "@vocab" : "http://www.owl-ontologies.com/itineraire.owl/",
            "transfer": "transfer",
            "totalDuration": "totalDuration",
            "departureTime":"departureTime",
            "arrivalTime":"arrivalTime",
            "co2emisson":"co2emisson",
            "cityDepart":"cityDepart",
            "cityDepartMeteo":"cityDepartMeteo",
            "cityArrive":"cityArrive",
            "cityArriveMeteo":"cityArriveMeteo",
            },
            "@graph": stat[0]
        }
        const myjsonStep = {
            "@context": {
            "@vocab" : "http://www.owl-ontologies.com/etape.owl/",
            "cityStart": "cityStart",
            "cityDepartureTime":"cityDepartureTime",
            "cityEnd": "cityEnd",
            "cityArrivalTime":"cityArrivalTime",
            "description":"description",
            },
            "@graph": stat[1]
        }
        // console.log(myjson,'original')
        // console.log(myjsonStep,'mtrip')
        const ntrip = await jsonld.toRDF(myjson, {format: 'application/n-quads'});
        const ntripStep = await jsonld.toRDF(myjsonStep, {format: 'application/n-quads'});
        
        fs.writeFileSync('D:/Users/Bureau/ESILV/Semantic/next/my-app/public/bikes.nt',ntrip);
        fs.appendFileSync('D:/Users/Bureau/ESILV/Semantic/next/my-app/public/bikes.nt',ntripStep);
        // first we clear our graph
        const resDelete = await axios({
            method: "POST",
            url: "http://localhost:3030/firstdf/",
            headers : {
                'Content-type': 'application/sparql-update'
            },
            data: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
            
            clear default`
        })

        // then we create a new graph    
        const resUpdate = await axios({
            method: "POST",
            url: "http://localhost:3030/firstdf",
            data: ntrip,
            headers: {
                'Content-Type': 'application/n-triples'
            }
        })
        const resUpdate2 = await axios({
            method: "POST",
            url: "http://localhost:3030/firstdf",
            data: ntripStep,
            headers: {
                'Content-Type': 'application/n-triples'
            }
        })
        const req1 = await sparkRequest();
        // console.log(mytest.data.results.bindings);
        const bindings = req1.data.results.bindings;
        let steps = []
        bindings.forEach((bind) => {
            let step = {
                cityStart: bind.cityStart.value,
                cityDepartureTime: bind.cityDepartureTime.value,
                cityEnd: bind.cityEnd.value,
                cityArrivalTime: bind.cityArrivalTime.value,
                description: bind.description.value,
                order: bind.order.value
            };
            steps.push(step);
        });
        const req2 = await sparkRequest2();
        // console.log(mytest.data.results.bindings);
        const bindings2 = req2.data.results.bindings;
        let travels = []
        bindings2.forEach((bind) => {
            let travel = {
                transfer: bind.transfer.value,
                totalDuration: bind.totalDuration.value,
                departureTime: bind.departureTime.value,
                arrivalTime: bind.arrivalTime.value,
                co2emisson: bind.co2emisson.value,
                cityDepart: bind.cityDepart.value,
                cityDepartMeteo: bind.cityDepartMeteo.value,
                cityArrive: bind.cityArrive.value,
                cityArriveMeteo: bind.cityArriveMeteo.value,
            };
            travels.push(travel);
        });
        let final = []
        final.push(travels);
        final.push(steps);
        return final
    }
    const finalR = await main();
    res.status(200).json({"itineraire" : finalR[0],"step":finalR[1]});
}