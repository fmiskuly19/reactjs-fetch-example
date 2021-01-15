import React, { useState, useEffect } from "react";
import "./styles.css";

const App = () => {
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  //recursively grab paged data and resolve the array of data
  const fetchPaginatedData = (url, items = []) => {
    url = url.replace(/^http:\/\//i, "https://"); //for some reason the SWAPI api returns their next page urls as http
    return new Promise((resolve, reject) =>
      fetch(url) //get url data
        .then((response) => {
          response
            .json() //get json of response (returns a promise so we go to next then)
            .then((item) => {
              items = items.concat(item); //add the current item to items array

              //if there is a next page, go get it
              if (item.next) {
                fetchPaginatedData(item.next, items).then(resolve); //resolve this promise
              } else {
                resolve(items); //if we dont have a next page, resolve this promise with the full item list
              }
            })
            .catch(reject);
        })
        .catch(reject)
    );
  };

  //concat all data from pages
  const getAllPagedData = (pages = []) => {
    let data = [];
    //loop through pages and concat their results
    for (const page of pages) {
      data = data.concat(page.results);
    }
    return data;
  };

  //draw characters in a list, this is only called when isLoading is false
  const drawCharacters = () => {
    return characters.map((character) => {
      return (
        <React.Fragment key={character.c.name}>
          <li>Name: {character.c.name}</li>
          <ul>
            <li>Born: {character.c.birth_year}</li>
            <li>Home Planet: {character.p.name}</li>
            <li>
              Species:{" "}
              {character.s
                ? character.s.name + ": " + character.s.classification
                : "No species information found"}
            </li>
          </ul>
          <br />
        </React.Fragment>
      );
    });
  };

  //will run once on initialization (empty dependency array)
  useEffect(() => {
    /* create an array of promises to resolve, in this case 
    we are going to recursively grab all paged data */

    /* This is a little overcomplicated for demonstration purposes but 
    its necessary to get all the paged data */
    let promises = [];
    promises.push(fetchPaginatedData("https://swapi.dev/api/people/"));
    promises.push(fetchPaginatedData("https://swapi.dev/api/planets/"));
    promises.push(fetchPaginatedData("https://swapi.dev/api/species/"));

    /* If we did not want to get all the paged data and just the first 
    page (or a single record) this would look like this: */

    // let promises = [];
    // promises.push(fetch("https://swapi.dev/api/people/2"));
    // promises.push(fetch("https://swapi.dev/api/planets/2"));
    // promises.push(fetch("https://swapi.dev/api/species/2"));

    /* You would resolve those promises like this: */

    // Promise.all(promises)
    //   .then((responses) => {
    //     return Promise.all(responses.map((x) => x.json()));
    //   })
    //   .then((results) => {
    //     let person = results[0];
    //     let planet = results[1];
    //     let species = results[2];
    //   });

    //resolve promises
    Promise.all(promises).then((result) => {
      let peoplePages = result[0];
      let planetsPages = result[1];
      let speciesPages = result[2];

      //concat all the results together
      let people = getAllPagedData(peoplePages);
      let planets = getAllPagedData(planetsPages);
      let species = getAllPagedData(speciesPages);

      let characterInfo = [];
      //loop through people and then go find species/planet
      for (const person of people) {
        //find planet by url in the planets list
        let planet = planets.find((planet) => planet.url === person.homeworld);
        //find species by url in the species list (some people dont have a species)
        let race = {};
        if (person.species)
          race = species.find((race) => race.url === person.species[0]);
        //push an object containing all this info into an array
        characterInfo.push({ c: person, p: planet, s: race });
      }

      //once weve gone through all people and got their info, set Characters
      setCharacters(characterInfo);
    });
    //we dont need to do anything about this warning, we only want this to run once on init
  }, []);

  //will only run when characters has been changed
  useEffect(() => {
    //if we have characters, we are done loading
    if (characters.length > 0) setIsLoading(false);
  }, [characters]);

  return isLoading ? (
    <React.Fragment>Loading</React.Fragment>
  ) : (
    <React.Fragment>
      <ol>{drawCharacters()}</ol>
    </React.Fragment>
  );
};

export default App;
