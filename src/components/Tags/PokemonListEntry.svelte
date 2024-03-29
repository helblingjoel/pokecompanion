<script lang="ts">
	import Image from '$components/UI/Image.svelte';
	import { getMultiLanguageName } from '$lib/utils/language';
	import { primaryLanguage, secondaryLanguage, theme } from '$lib/stores/domain';
	import type { ITagPokemon } from '$lib/types/ITags';
	import { getPokemonEntry } from '$lib/data/games';
	import Icon from '$components/UI/Icon.svelte';
	import { pokemonVarietyNameToDisplay } from '$lib/utils/string';

	export let pokemon: ITagPokemon;
	export let showRemoveButton: boolean;
	export let onRemoveClick: () => void;
	export let showGenderAndShiny: boolean;

	const namePrefix = pokemonVarietyNameToDisplay(pokemon.variety?.name ?? '');
</script>

<div class="card clickable" id={`${pokemon.id}`}>
	<a
		href={`/pokemon/${pokemon.id}?shiny=${pokemon.shiny}${
			pokemon.gender ? `&gender=${pokemon.gender}` : ''
		}${pokemon.variety ? `&variety=${pokemon.variety.name}` : ''}`}
	>
		<div>
			<div class="spriteWrapper">
				<Image
					src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon${
						pokemon.shiny ? '/shiny' : ''
					}${pokemon.gender === 'female' ? '/female' : ''}/${
						pokemon.variety ? pokemon.variety.spriteId : pokemon.id
					}.png`}
					alt={`sprite`}
					loading="lazy"
					height="96px"
					width="96px"
				/>
			</div>

			<p style="margin-top: auto; margin-bottom: auto;">
				#{pokemon.id}
				{getMultiLanguageName(
					getPokemonEntry(pokemon.id).names,
					$primaryLanguage,
					$secondaryLanguage,
					namePrefix
				)}
			</p>
		</div>

		<div>
			{#if showGenderAndShiny}
				{#if pokemon.gender === 'female'}
					<Icon
						name="venus"
						style={`fill: ${$theme === 'dark' ? '#f6abd9' : '#ee5db7'}; margin: auto;`}
					/>
				{:else if pokemon.gender === 'male'}
					<Icon
						name="mars"
						style={`fill: ${
							$theme === 'dark' ? '#99b3ff' : '#3366ff'
						}; margin: auto; margin-right: 0.5rem;`}
					/>
				{/if}

				{#if pokemon.shiny}
					{#if $theme === 'light'}
						<Icon
							name="spark"
							style="margin-top: 1.25rem"
							lineStroke="var(--text)"
							pathStroke="var(--text)"
						/>
					{:else}
						<Icon
							name="spark-full"
							style="margin-top: 1.25rem"
							pathFill="var(--text)"
							lineStroke="var(--text)"
							pathStroke="var(--text)"
						/>
					{/if}
				{/if}
			{/if}
		</div>
	</a>
	{#if showRemoveButton}
		<button class="removeButton" on:click={onRemoveClick}>-</button>
	{/if}
</div>

<style>
	a {
		text-decoration-line: unset;
		display: inline-flex;
		align-items: center;
		width: 100%;
		justify-content: space-between;
	}

	a > div {
		display: inline-flex;
	}

	a > div:first-child {
		width: 80%;
	}

	a > div:last-child {
		justify-content: end;
		margin-right: 1rem;
	}

	.card {
		position: relative;
		padding: 0.25rem;
		margin: 1rem;
	}

	.removeButton {
		position: absolute;
		top: 0;
		right: 0;
		text-align: center;
		height: 2rem;
		width: 2rem;
		border-radius: 10%;
		font-weight: bold;
		color: var(--light);
		background-color: var(--error);
		z-index: 5;
	}

	.spriteWrapper {
		height: 96px;
		width: 96px;
		padding: 1rem;
	}

	@media screen and (min-width: 768px) {
		.card {
			max-width: 45%;
		}
	}
</style>
