import { get, writable } from 'svelte/store';
import { getCookie, getRawCookie, setCookie } from '../utils/cookies';
import type { Languages } from '../utils/language';
import PokemonNames from '$lib/data/pokemonNames.json';
import Pocketbase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import { currentUser, type SignedInUser } from './user';
import { findGameFromString, type IGame } from '$lib/data/games';
import { v4 as uuid } from 'uuid';
import { page } from '$app/stores';

export const theme = writable<'dark' | 'light' | undefined>();
export const selectedGame = writable<IGame | undefined>();
export const primaryLanguage = writable<keyof Languages>('en');
export const secondaryLanguage = writable<keyof Languages | undefined>();
export const versionSpecificSprites = writable<boolean>(true);
export const animateSprites = writable<boolean>(true);
export const rememberToken = writable<string>(uuid());
export const homepageMessaging = writable<string>('');
export const pokeApiDomain = 'https://pokeapi.co/api/v2';
export const lastPokedexEntry =
	PokemonNames.findLast((entry) => {
		return entry.id < 10000;
	})?.id ?? 5000;
export const maxSearchResults = 15;
export const pokemonPageSize = 50;
export const pb = writable(new Pocketbase(PUBLIC_POCKETBASE_URL));
import * as Sentry from '@sentry/browser';

// TODO - Test this
export const cookieHandlers = {
	selectedGame: () => {
		const isInSearchParam = get(page).url.searchParams.get('game');
		let existingValue = getCookie('selectedGame');

		if (isInSearchParam) {
			existingValue = isInSearchParam;
		} else {
			if (!existingValue) {
				existingValue = 'generic';
				setCookie('selectedGame', existingValue);
			}
		}

		const foundGame = findGameFromString(existingValue);
		selectedGame.set(foundGame);

		selectedGame.subscribe((value) => {
			Sentry.setTag('selectedGame', value?.name);

			const isInSearchParam = get(page).url.searchParams.get('game');

			if (isInSearchParam) {
				return;
			}

			if (!value) {
				setCookie('selectedGame', 'generic');
				return;
			}

			const existingCookie = getCookie('selectedGame');
			const existingValue = findGameFromString(existingCookie || '');
			if (!existingValue || value.cookieGroup !== existingValue.cookieGroup) {
				setCookie('selectedGame', value.cookieGroup);
			}
		});
	},
	primaryLanguage: () => {
		const isInSearchParam = get(page).url.searchParams.get('primaryLanguage');
		let existingValue = getCookie('primaryLanguage') as keyof Languages;

		if (isInSearchParam) {
			existingValue = isInSearchParam as keyof Languages;
		} else {
			if (!existingValue) {
				existingValue = 'en';
				setCookie('primaryLanguage', existingValue);
			}
		}

		primaryLanguage.set(existingValue);

		primaryLanguage.subscribe((value) => {
			Sentry.setTag('primaryLanguage', value);
			const isInSearchParam = get(page).url.searchParams.get('primaryLanguage');

			if (!value || isInSearchParam) {
				return;
			}
			const existing = getCookie('primaryLanguage');
			if (!existing || value !== existing) {
				setCookie('primaryLanguage', value);
			}

			// Invalidate the secondary language if it's somehow set to the same
			if (value === getCookie('secondaryLanguage')) {
				setCookie('secondaryLanguage', 'none');
			}
		});
	},
	secondaryLanguage: () => {
		const isInSearchParam = get(page).url.searchParams.get('secondaryLanguage');
		let existingValue = getCookie('secondaryLanguage') as keyof Languages | undefined;

		if (isInSearchParam) {
			existingValue = isInSearchParam as keyof Languages;
		} else {
			if (!existingValue) {
				existingValue = 'none';
				setCookie('secondaryLanguage', existingValue);
			}
		}

		secondaryLanguage.set(existingValue);

		secondaryLanguage.subscribe((value) => {
			Sentry.setTag('secondaryLanguage', value);
			const isInSearchParam = get(page).url.searchParams.get('secondaryLanguage');

			if (!value || isInSearchParam) {
				return;
			}

			if (!value) {
				value = 'none';
			}
			const existing = getCookie('secondaryLanguage');
			if (!existing || value !== existing) {
				setCookie('secondaryLanguage', value);
			}
		});
	},
	versionSpecificSprites: () => {
		let existingValue = getCookie('versionSpecificSprites') as boolean | undefined;
		if (existingValue === undefined || null) {
			existingValue = true;
			setCookie('versionSpecificSprites', existingValue.toString());
		}

		versionSpecificSprites.set(existingValue);

		versionSpecificSprites.subscribe((value) => {
			Sentry.setTag('versionSpecificSprites', value);
			setCookie('versionSpecificSprites', value.toString());
		});
	},
	animateSprites: () => {
		let existingValue = getCookie('animateSprites') as boolean | undefined;
		if (existingValue === undefined || null) {
			existingValue = true;
			setCookie('animateSprites', existingValue.toString());
		}

		animateSprites.set(existingValue);

		animateSprites.subscribe((value) => {
			Sentry.setTag('animateSprites', value);
			setCookie('animateSprites', value.toString());
		});
	},
	auth: () => {
		const authedPb = new Pocketbase(PUBLIC_POCKETBASE_URL);
		authedPb.authStore.loadFromCookie(getRawCookie(document.cookie, 'pb_auth') || '');
		currentUser.set(authedPb.authStore.model as SignedInUser);
		pb.set(authedPb);
	},
	rememberToken: () => {
		let existingValue = getCookie('remember-token') as string | undefined;
		if (!existingValue) {
			existingValue = uuid();
			setCookie('remember-token', get(rememberToken));
		}
		rememberToken.set(existingValue);

		rememberToken.subscribe((value) => {
			Sentry.setUser({
				id: value
			});

			if (!value) {
				return;
			}
			const existing = getCookie('remember-token');
			if (!existing || value !== existing) {
				setCookie('remember-token', value);
			}
		});
	},
	homepageMessaging: () => {
		let existingValue = getCookie('homepage-messaging') as string | undefined;
		if (!existingValue) {
			existingValue = 'new-visitor';
			setCookie('homepage-messaging', get(homepageMessaging));
		}
		homepageMessaging.set(existingValue);

		homepageMessaging.subscribe((value) => {
			if (!value) {
				return;
			}
			const existing = getCookie('homepage-messaging');
			if (!existing || value !== existing) {
				setCookie('homepage-messaging', value);
			}
		});
	}
};
