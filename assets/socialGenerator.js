import fs from 'fs';
import fetch from 'node-fetch';
import PokemonNames from '../src/lib/data/pokemonNames.json' assert { type: 'json' };
import sharp from 'sharp';

const genericFile = fs.readFileSync('./assets/socialPreview.svg', 'utf-8');
const pokemonFile = fs.readFileSync('./assets/pokemonSocialPreview.svg', 'utf-8');

function getLastPokemonId() {
	let highest = 1;
	PokemonNames.forEach((a) => {
		if (highest < a.id && a.id < 10000) {
			highest = a.id;
		}
	});
	return highest;
}
const lastPokemonId = getLastPokemonId();

function convertSvgToPng(svgContent, pngFilePath, width, height, overlayBuffer) {
	const image = sharp(Buffer.from(svgContent), { density: 300 }) // Set density for better quality (optional)
		.resize(width, height);
	if (overlayBuffer) {
		sharp(overlayBuffer)
			.resize({ width: 300, height: 300 }) // Scale the image by 2x
			.toBuffer()
			.then((scaledOverlayBuffer) => {
				image.composite([{ input: scaledOverlayBuffer, top: 280, left: 270 }]); // Adjust top and left values as needed
				image.toFile(pngFilePath, (err, info) => {
					if (err) {
						console.error('Error converting SVG to PNG:', err, info);
					}
				});
			})
			.catch((err) => {
				console.log(`Failure when overlaying image ${pngFilePath} - ${err}`);
			});
	} else {
		image.toFile(pngFilePath, (err, info) => {
			if (err) {
				console.error('Error converting SVG to PNG:', err, info);
			}
		});
	}
}

if (!fs.existsSync('./static/socialpreview')) {
	fs.mkdirSync('./static/socialpreview');
}
if (!fs.existsSync('./static/socialpreview/pokemon')) {
	fs.mkdirSync('./static/socialpreview/pokemon');
}

const generic = genericFile.replace(/Top Text/, 'Pokécompanion').replace(/Bottom Text/, '');
convertSvgToPng(generic, `./static/socialpreview/generic.png`, 1200, 630);

const home = genericFile.replace(/Top Text/, 'Pokécompanion').replace(/Bottom Text/, 'Homepage');
convertSvgToPng(home, `./static/socialpreview/home.png`, 1200, 630);

const about = genericFile.replace(/Top Text/, 'Pokécompanion').replace(/Bottom Text/, 'About');
convertSvgToPng(about, `./static/socialpreview/about.png`, 1200, 630);

const settings = genericFile
	.replace(/Top Text/, 'Pokécompanion')
	.replace(/Bottom Text/, 'Settings');
convertSvgToPng(settings, `./static/socialpreview/settings.png`, 1200, 630);

const results = genericFile
	.replace(/Top Text/, 'Pokécompanion')
	.replace(/Bottom Text/, 'Search Results');
convertSvgToPng(results, `./static/socialpreview/results.png`, 1200, 630);

const pokemonPage = genericFile
	.replace(/Top Text/, 'Pokécompanion')
	.replace(/Bottom Text/, 'Pokémon');

convertSvgToPng(pokemonPage, `./static/socialpreview/pokemonPage.png`, 1200, 630);

const movesPage = genericFile.replace(/Top Text/, 'Pokécompanion').replace(/Bottom Text/, 'Moves');
convertSvgToPng(movesPage, `./static/socialpreview/moves.png`, 1200, 630);

// for (let i = 0; i < 2; i++) {
for (let i = 0; i < lastPokemonId; i++) {
	const name = PokemonNames[i].names.find((name) => {
		return name.en;
	});

	const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${
		i + 1
	}.png`;

	fetch(imageUrl)
		.then(async (res) => {
			return { buffer: await res.arrayBuffer(), status: res.status };
		})
		.then(({ buffer, status }) => {
			const fullData = pokemonFile
				.replace(/Top Text/, 'Pokécompanion')
				.replace(/Bottom Text/, name.en);

			if (!fs.existsSync(`./static/socialpreview/pokemon/${i + 1}`)) {
				fs.mkdirSync(`./static/socialpreview/pokemon/${i + 1}`);
			}

			convertSvgToPng(
				fullData,
				`./static/socialpreview/pokemon/${i + 1}/shiny-female.png`,
				1200,
				630,
				status === 200 ? buffer : undefined
			);

			const shinyMale = fullData.replace('id="female"', 'id="female" style="display: none;"');
			convertSvgToPng(
				shinyMale,
				`./static/socialpreview/pokemon/${i + 1}/shiny-male.png`,
				1200,
				630,
				status === 200 ? buffer : undefined
			);
			const male = shinyMale.replace('id="shiny"', 'id="shiny" style="display: none;"');
			convertSvgToPng(male, `./static/socialpreview/pokemon/${i + 1}/male.png`, 1200, 630, buffer);

			const female = fullData.replace('id="shiny"', 'id="shiny" style="display: none;"');
			convertSvgToPng(
				female,
				`./static/socialpreview/pokemon/${i + 1}/female.png`,
				1200,
				630,
				status === 200 ? buffer : undefined
			);

			const generic = female.replace('id="gender"', 'id="gender" style="display: none;"');
			convertSvgToPng(
				generic,
				`./static/socialpreview/pokemon/${i + 1}/generic.png`,
				1200,
				630,
				status === 200 ? buffer : undefined
			);
		})
		.catch((err) => console.error(`Error fetching image: ${err}`));
}
