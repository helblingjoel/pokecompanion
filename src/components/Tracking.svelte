<script lang="ts">
	import { navigating } from '$app/stores';
	import { logToAxiom } from '$lib/log';
	import { onMount } from 'svelte';
	import { removeLastCharIfExists } from '$lib/utils/string';
	import {
		animateSprites,
		homepageMessaging,
		primaryLanguage,
		rememberToken,
		secondaryLanguage,
		selectedGame,
		versionSpecificSprites
	} from '$lib/stores/domain';
	import { getCookie } from '$lib/utils/cookies';
	import type { Languages } from '$lib/utils/language';
	import { findGameFromString } from '$lib/data/games';
	import { PUBLIC_ENVIRONMENT, PUBLIC_SENTRY_DSN } from '$env/static/public';
	import * as Sentry from '@sentry/browser';

	let navsAsNewUser = 0;
	navigating.subscribe(async (nav) => {
		if (nav) {
			if ($primaryLanguage !== getCookie('primaryLanguage')) {
				primaryLanguage.set(getCookie('primaryLanguage') as keyof Languages);
			}
			if ($secondaryLanguage !== getCookie('secondaryLanguage')) {
				secondaryLanguage.set(getCookie('secondaryLanguage') as keyof Languages);
			}
			if ($selectedGame !== getCookie('selectedGame')) {
				selectedGame.set(findGameFromString(getCookie('selectedGame')));
			}

			await nav.complete;
			logToAxiom({
				action: 'pageview',
				referrer: {
					url: nav.from?.url.href,
					navSource: 'internal'
				},
				url: {
					host: nav.to?.url.host,
					hostname: nav.to?.url.hostname,
					href: nav.to?.url.href,
					pathname:
						nav.to?.url.pathname !== '/'
							? removeLastCharIfExists(nav.to?.url.pathname ?? 'no data', '/')
							: '/',
					search: nav.to?.url.search,
					hash: nav.to?.url.hash
				}
			});

			if ($homepageMessaging === 'new-user') {
				navsAsNewUser += 1;

				if (navsAsNewUser > 20) {
					homepageMessaging.set('returning-user');
				}
			}
		}
	});

	onMount(() => {
		logToAxiom({
			action: 'pageview',
			referrer: {
				url: document.referrer,
				navSource: 'external'
			}
		});

		Sentry.init({
			dsn: PUBLIC_SENTRY_DSN,
			environment: PUBLIC_ENVIRONMENT ?? 'local',
			integrations: [new Sentry.BrowserTracing()],
			tracesSampleRate: 1.0,
			replaysOnErrorSampleRate: 1.0,
			initialScope: {
				user: {
					id: $rememberToken
				},
				tags: {
					selectedGame: $selectedGame?.name ?? 'No game set',
					primaryLanguage: $primaryLanguage,
					secondaryLanguage: $secondaryLanguage,
					versionSpecificSprites: $versionSpecificSprites,
					animateSprites: $animateSprites
				}
			}
		});
	});
</script>
