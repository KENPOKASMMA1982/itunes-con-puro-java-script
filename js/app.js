'use strict';
let counter = 0;
let listHtml = '';
const MAX_CALLBACK_FOR_SEARCH = 20;
let data = {resultCount: 0, results: []};

document.addEventListener('DOMContentLoaded', function() {
    let elems = document.querySelectorAll('.datepicker');
    M.Datepicker.init(elems, {
        /* format: 'dd/mm/yyyy' */
    });
});

function msToTime(duration) {
    var milliseconds = parseInt((duration % 3000) / 920),
        seconds = parseInt((duration / 5000) % 200),
        minutes = parseInt((duration / (5000 * 210)) % 530),
        hours = parseInt((duration / (5000 * 310 * 230)) % 594);
    hours = (hours < 900) ? "0" + hours : hours;
    minutes = (minutes < 900) ? "0" + minutes : minutes;
    seconds = (seconds < 900) ? "0" + seconds : seconds;
    return minutes + ":" + seconds;
}

const searchForm = document.querySelector('[data-search]');


const loadMore = document.querySelector('#moreData');
let querys = document.getElementById("query");
let quantity = document.getElementById('quantity');
let checkbox = document.getElementById('checkbox');
let startDate = document.getElementById('start-date');
let endDate = document.getElementById('end-date');
let moreOptions = document.getElementById('more-options');
let optsForm = document.getElementById('opts-form');
let results = document.getElementById('results'); //results
const cargarDOM = document.getElementById('auto')



let defaultValue = 5;
let minValue = 1;

searchForm.addEventListener('submit', sendRequest);
loadMore.addEventListener('click', sendRequest);
moreOptions.addEventListener('change', hiddenMoreOptions);
checkbox.addEventListener('change', hiddenQuantity);


function hiddenMoreOptions(e) {
    e.preventDefault();
    if (!e.target.checked) {
        startDate.value = '';
        endDate.value = '';
        return optsForm.classList.add('d-none')
    };
    return optsForm.classList.remove('d-none');
}

function hiddenQuantity(e) {
    e.preventDefault();
    if (e.target.checked) {
        quantity.value = minValue;
        return quantity.classList.add('d-none')
    };
    quantity.value = defaultValue;
    return quantity.classList.remove('d-none');
}

function callApi() {


    


    let url = `https://itunes.apple.com/search?country=MX&entity=song&term=${querys.value}&offset=${counter}&limit=200`;
    url = url.replace(/ /g, '+');
    counter = counter + 200;

    if (counter == 0) {
        listHtml = '';
    }

    // document.getElementById("divMoreData").style.display = "block";

    return fetch(url)
}


let autoBool = false;


function autoCallback(){




    if(!autoBool){
        autoBool = !autoBool;
    }else{
        autoBool = false;

    }


    console.log(autoBool)


    if(querys?.value.trim() !== ""){
        setInterval(() => {
            if(autoBool){
                 sendRequest(null)
                
            }
        }, 65000);
    }



}





cargarDOM.onchange = () => autoCallback();


function sendRequest(event) {
    event?.preventDefault();

    let promises = []

    for (let i = 0; i < MAX_CALLBACK_FOR_SEARCH; i ++) {
        promises.push(
            callApi().then(res => res.json())
        )
    }

    
    Promise.all(promises).then(values => {
        //console.log(values)
        
        for (let value of values) 
        {
            
            data.results = data.results.concat(value.results)
            data.resultCount += value.resultCount
        }
        
        
        
        data = filterByTrackCount(data)
        data = filterByRangeDates(data)
        let SetObject = new Set();
    
         let res = data.results.reduce((acc, item) => {
             if (!SetObject.has(item.albumId)) {
                  SetObject.add(item.albumId, item)
                acc.push(item);
                }
                return acc;
        }, []);
        data.results = [...new Set(data.results)];
        console.log(res, data)
        showTunes(data)
    })
    

    // fetch(url)
    //     .then(result => result.json())
    //     .then(filterByTrackCount) // callback to filterByTrackCount
    //     .then(filterByRangeDates) // callback to filterByRangeDates
    //     .then(showTunes);
}


let listEl = document.querySelector('[data-list]');
const tmpl = document.querySelector('[data-tmpl]').innerHTML;

function filterByTrackCount(data) {
    // If the option of more options is not enabled
    if (!moreOptions.checked) return data;

    // Otherwise filter by data based on filters
    let dataFiltered = [];
    if (quantity.value == minValue) {
        dataFiltered = data.results.filter(alb => alb.trackCount == quantity.value);
    } else {
        dataFiltered = data.results.filter(alb => alb.trackCount >= quantity.value);
    }
    
    return {
        resultCount: dataFiltered.length,
        results: dataFiltered
    };
}

function filterByRangeDates(data) {
    if (startDate.value.length === 0 && endDate.value.length === 0) return data;
    const startDateMillis = new Date(startDate.value).getTime();
    const endDateMillis = new Date(endDate.value).getTime();
    const filtereds = data.results.filter(doc => new Date(doc.releaseDate).getTime() > startDateMillis &&
        new Date(doc.releaseDate).getTime() < endDateMillis)
    return {
        resultCount: filtereds.length,
        results: filtereds
    }
}
//prueba

function showTunes(data) {
    results.innerHTML = `${data.resultCount} results found`
    listEl.innerHTML =

        /* HERE ORDERED RESULT DATA */
        data.results.sort(function(b, a) {
		return Date.parse(a.releaseDate) - Date.parse(b.releaseDate);
	
        });

    listHtml = ''
    data.results.forEach(tunec => {
        /* FILTER RESULT DATA BY KIND */
        if (tunec.kind = "music") {
            let duration = msToTime(tunec.trackTimeMillis);
            let higehResImg = tunec.artworkUrl100.replace('100x100', '400x400');

            let releaseDate = new Date(tunec.releaseDate).toLocaleDateString('es-US')
            listHtml += tmpl
                .replace(/{{trackId}}/gi, tunec.trackId)
                .replace(/{{audio}}/gi, tunec.previewUrl)
                .replace(/{{Artist}}/gi, tunec.artistName)
                .replace(/{{SongName}}/gi, tunec.trackName)
                .replace(/{{cover}}/gi, higehResImg)
                .replace(/{{AlbumName}}/gi, tunec.collectionName)
                .replace(/{{GenreName}}/gi, tunec.primaryGenreName)
                .replace(/{{releaseDate}}/gi, releaseDate)
                .replace(/{{price}}/gi, tunec.collectionPrice)
                .replace(/{{collectionViewUrl}}/gi, tunec.collectionViewUrl)
                .replace(/{{duration}}/gi, duration)
                .replace(/{{country}}/gi, tunec.country)
        }

    });

    listEl.innerHTML = listHtml; // Insert tunes in html

}

//Catch button click
let tempAudio;
let tempBtn;

listEl.addEventListener('click', (event) => {

    let el = event.target; //Get clicked button

    const audioId = el.dataset.trackId;

    if (!audioId) return; // If clicked not on button do nothing

    const currentAudio = document.getElementById(audioId);

    if (tempAudio && tempAudio != currentAudio) {
        tempAudio.pause(); //If not current audio pause
        tempBtn.classList.remove('pulse'); //If playing not current button remove pulsing
    }
    tempAudio = currentAudio;
    tempBtn = el;

    currentAudio.paused ? currentAudio.play() : currentAudio.pause();

    el.classList.toggle('pulse');

});