const language = require('@google-cloud/language')
const client = new language.LanguageServiceClient()

const express = require('express')
const cors = require('cors')
const app = express()
const request = require('request')
const getJSON = require('get-json')
const { resolve } = require('path')

app.use(cors())

var text = ''
var SentimentData = []
var EntitySentimentData = []
var overallSentiment = 0
var deviation = {
	sentenceData: []
}
var entites = {}

var FinalData = {
	sentences: [],
	entities: []
}

app.get('/api/analysis',(req,res)  => {
	console.log(req.query); // Query format: http://localhost:8080/api/analysis?text=[text] 
							// Ex [text]: hello+world!+my+name+is+Rohith!
	if (req.query.text) {
		text = req.query.text.replace(/%20/g,' ').replace(/%E2%80%99/g,'\'');
		console.log('LINE 34' + text.replace('%20',' '));
	} else {
		throw 'Error: GET request was not made properly. Expected query value \'text\' but received nothing.'
	}

	//Google NLP ---------------------
	const document = {
		content: text, 
		type: 'PLAIN_TEXT'
	};

	client.analyzeSentiment({document: document})
	.then(results => {
		//Sentiment Data ----------------------
		for (const elem of results[0].sentences) {
			if (elem != null) {
				var sentence = elem.text.content + '|' + 'MAGNITUDE: ' + elem.sentiment.magnitude
				//console.log(sentence)
				SentimentData.push(sentence)
			}
		}
		overallSentiment = results[0].documentSentiment.magnitude
		//Sentiment Data ----------------------

		client.analyzeEntitySentiment({document: document})
		.then(results1 => {
			//Entity Data ----------------------
			for (const elem of results1[0].entities) {
				if (elem != null) {
					entity = elem.name + '|' + 'IMPORTANCE: ' + elem.salience + '|' + 'MAGNITUDE: ' + elem.sentiment.magnitude + '|' + 'METADATA: ' + elem.metadata.wikipedia_url
					EntitySentimentData.push(entity);
				}
			}
			//Entity Data ----------------------
				
			let finalData = new Promise (function (res,rej) {
				// ..
				// implemented ranking algorithm here
				// ..

				//Store sentences based on standard deviation from OVERALL_MAGNITUDE
				for (const elem of SentimentData) {
					var mag = elem.split('|')
					//console.log('AT 74 ' + elem)
					var absDev = Math.abs(overallSentiment - parseFloat(mag[1].replace('MAGNITUDE: ','')))
					deviation.sentenceData.push({
						'deviation'	:	absDev,
						'sentence'	:	mag[0]
					})
					deviation[absDev] = mag[0]; //storing sentence and deviation from OVERALL_MAGNITUDE in key value pairs [key: deviation (float) | value: sentence]
				}

				//Store entities as key value pairs [key: entity | value: IMPORTANCE + MAGNITUDE + METADATA]
				for (const elem of EntitySentimentData) {
					var entityData = elem.split('|')
					entites[entityData[0]] = entityData[1] + entityData[2] + entityData[3]
				}
				
				//checks to see if sentence contains entity, if sentence contains entity key is incremented by 0.1 and if entity contains metadata key is incremented by 0.1
				for (var key = 0; key < deviation.sentenceData.length; key++) { //iterating through each sentence
					console.log("_______ITERATED THROUGH THIS ONE " + deviation.sentenceData[key]) 
					for (var entity in entites) { //iterating through each entity for each sentence
						console.log("+++++++++++_______ITERATED THROUGH THIS ONE " + deviation[key] + ' and this entity ' + entity)
						if ((deviation.sentenceData[key].sentence).includes(entity)) {
							inc = 0.05
							if (!entites[entity].includes('METADATA: undefined')) {
								inc += 0.05
							}
							deviation.sentenceData[key].deviation += inc
							console.log('!@#$%' + deviation[parseFloat(key)+inc])
						}
					}
				}
				
				//putting all data in JSON format 

				for (const elem of deviation.sentenceData) {
					console.log(elem.sentence + ' %% ' +elem.deviation)
					FinalData.sentences.push({
						'sentence'	:	elem.sentence,
						'rank'		:	elem.deviation
					})
				}

				importanceTolerance = 0; 
				length = 0;
				for (const elem in entites) {
					//console.log(entites[elem] + ' %% ' +elem)
					parts = entites[elem].split(' ')
					curImportance = parseFloat(parts[1].replace('MAGNITUDE:',''))
					importanceTolerance += curImportance
					length += 1
				}
				importanceTolerance = importanceTolerance / length

				for (const elem in entites) {
					//console.log(entites[elem] + ' %% ' +elem)
					parts = entites[elem].split(' ')
					curImportance = parseFloat(parts[1].replace('MAGNITUDE:',''))
					if (curImportance > importanceTolerance) {
						FinalData.entities.push({
							'word'		:	elem,
							'link'		:	parts[3]
						})
					} else if (parts[3] != 'undefined') {
						FinalData.entities.push({
							'word'		:	elem,
							'link'		:	parts[3]
						})
					}
				}


				resolve("")
			})
			.catch (err => {
				console.error('Error: ' + err);
			})

			res.send(FinalData)
			text = '';
			SentimentData = [];
			EntitySentimentData = [];
			overallSentiment = 0
			deviation = {
				sentenceData: []
			}
	 		entites = {}
			FinalData = {
				sentences: [],
				entities: []
			}
		})
	})
	.catch (err => {
		console.error('Error: ' + err);
	})
})

app.listen(8080, () => {
    console.log('listening on port 8080');
})
