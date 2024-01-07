import type { IType } from '$lib/stores/pokemonPageStore';
import type { Ability, Generation, IPokemon } from '$lib/types/IPokemon';
import { Generations, type IGame, type IGeneration } from './games';

export const getPokemonTypesInGame = (pokemon: IPokemon, generation?: IGeneration): IType[] => {
	const vanillaTypes = pokemon.types.map((typeEntry) => {
		return {
			name: typeEntry.type.name,
			icon: `/icons/types/${typeEntry.type.name}.webp`,
			url: typeEntry.type.url
		};
	});

	if (pokemon.past_types.length === 0 || !generation) {
		return vanillaTypes;
	}

	const currentGenIndex = Generations.findIndex((gen) => {
		return gen.pokeApiName === generation.pokeApiName;
	});

	const pastTypes = pokemon.past_types
		.map((pastType) => {
			const genIndex = Generations.findIndex((gen) => {
				return gen.pokeApiName === pastType.generation.name;
			});

			if (currentGenIndex <= genIndex) {
				return pastType.types.map((type) => {
					return {
						name: type.type.name,
						icon: `/icons/types/${type.type.name}.webp`,
						url: type.type.url
					};
				});
			}
		})
		.flat()
		.filter((a) => a !== undefined) as {
		name: string;
		icon: string;
		url: string;
	}[];

	return pastTypes.length > 0 ? pastTypes : vanillaTypes;
};

export const addImageToType = (type: IType) => {
	return {
		name: type.name,
		icon: `/icons/types/${type.name}.webp`,
		url: type.url
	};
};

interface ITypeResponse {
	damage_relations: {
		half_damage_from: {
			name: string;
		}[];
		no_damage_from: {
			name: string;
		}[];
		double_damage_from: {
			name: string;
		}[];
	};
}

export interface ITypeRelations {
	resists: ITypeDetails[];
	weakAgainst: ITypeDetails[];
}

interface ITypeDetails {
	name: string;
	url: string;
	multiplier: number;
	icon: string;
}

export const getTypeRelations = async (a: IType, b: IType | undefined): Promise<ITypeRelations> => {
	const requests = [fetch(a.url)];
	if (b) {
		requests.push(fetch(b.url));
	}

	const responses = await Promise.all(requests);
	const types = (await Promise.all(responses.map((a) => a.json()))) as ITypeResponse[];

	const resists = types.flatMap((type) => [
		...type.damage_relations.half_damage_from.map(({ name }) => ({
			name: name,
			icon: `/icons/types/${name}.webp`,
			url: '',
			multiplier: 0.5
		})),
		...type.damage_relations.no_damage_from.map(({ name }) => ({
			name: name,
			icon: `/icons/types/${name}.webp`,
			url: '',
			multiplier: 0
		}))
	]);

	const weakAgainst = types.flatMap((type) =>
		type.damage_relations.double_damage_from.map(({ name }) => ({
			name: name,
			icon: `/icons/types/${name}.webp`,
			url: '',
			multiplier: 2.0
		}))
	);

	const combineMultipliers = (acc: ITypeDetails[], curr: ITypeDetails) => {
		const existingType = acc.find((type) => type.name === curr.name);
		if (existingType) {
			existingType.multiplier *= curr.multiplier;
		} else {
			acc.push(curr);
		}
		return acc;
	};

	const weakBackup = [...weakAgainst];

	const sortedResists = resists
		.reduce(combineMultipliers, [])
		.filter((a) => {
			const weakEntry = weakBackup.find((b) => b.name === a.name);
			if (weakEntry) {
				if (a.multiplier === 0) {
					return true;
				}
				return false;
			}
			return true;
		})
		.sort((a, b) => (a.name < b.name ? 1 : -1))
		.sort((a, b) => (a.multiplier > b.multiplier ? 1 : -1));
	const sortedWeakAgainst = weakAgainst
		.reduce(combineMultipliers, [])
		.filter((a) => {
			const resistsEntry = resists.find((b) => b.name === a.name);
			if (resistsEntry) {
				return false;
			}
			return true;
		})
		.sort((a, b) => (a.name < b.name ? 1 : -1))
		.sort((a, b) => (a.multiplier < b.multiplier ? 1 : -1));

	return {
		resists: sortedResists,
		weakAgainst: sortedWeakAgainst
	};
};

export const fixAbilities = (
	id: number,
	pastAbilities: {
		abilities: Ability[];
		generation: Generation;
	}[],
	abilities: Ability[],
	game: IGame | undefined
) => {
	if (!game) {
		return abilities;
	}

	const selectedGenerationEntry = Generations.find(
		(a) => a.pokeApiName === game.generation.pokeApiName
	);
	const selectedGeneration = selectedGenerationEntry
		? Generations.indexOf(selectedGenerationEntry) + 1
		: Number.MAX_SAFE_INTEGER;

	const abilityOverrides = pastAbilities
		.filter((past) => {
			const pastGeneration = Generations.find((a) => a.pokeApiName === past.generation.name);
			const pastGenerationIndex = pastGeneration ? Generations.indexOf(pastGeneration) + 1 : -1;
			return selectedGeneration <= pastGenerationIndex;
		})
		.map((a) => a.abilities)
		.flat();

	const merged = abilities.map((ability) => {
		const overriddenEntry = abilityOverrides.filter((a) => a.slot === ability.slot);

		if (overriddenEntry.length === 0) {
			return ability;
		}

		return overriddenEntry[0];
	});

	return merged;
};
