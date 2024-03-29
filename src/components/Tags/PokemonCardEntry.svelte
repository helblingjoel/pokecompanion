<script lang="ts">
	import { getMultiLanguageName } from '$lib/utils/language';
	import Image from '$components/UI/Image.svelte';
	import { primaryLanguage, secondaryLanguage, theme } from '$lib/stores/domain';
	import type { ITagPokemon } from '$lib/types/ITags';
	import { getPokemonEntry } from '$lib/data/games';
	import Icon from '$components/UI/Icon.svelte';
	import { pokemonVarietyNameToDisplay } from '$lib/utils/string';

	export let pokemon: ITagPokemon;
	export let showRemoveButton: boolean;
	export let showGenderAndShiny: boolean;
	export let onRemoveClick: () => void = () => null;
	export let style: string = '';

	const namePrefix = pokemonVarietyNameToDisplay(pokemon.variety?.name ?? '');
</script>

<div class="card" id={`${pokemon.id}`} {style}>
	<a
		href={`/pokemon/${pokemon.id}?shiny=${pokemon.shiny}${
			pokemon.gender ? `&gender=${pokemon.gender}` : ''
		}${pokemon.variety ? `&variety=${pokemon.variety.name}` : ''}`}
		class="clickable"
	>
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
		<p>#{pokemon.id}</p>
		<p>
			{getMultiLanguageName(
				getPokemonEntry(pokemon.id).names,
				$primaryLanguage,
				$secondaryLanguage,
				namePrefix
			)}
		</p>
	</a>

	{#if showGenderAndShiny}
		<div class="indicators">
			{#if pokemon.gender === 'female'}
				<Icon
					name="venus"
					style={`margin-top: auto; margin-bottom: auto; padding-left: 10px; fill: ${
						$theme === 'dark' ? '#f6abd9' : '#ee5db7'
					};`}
				/>
			{:else if pokemon.gender === 'male'}
				<Icon
					name="mars"
					style={`margin-top: auto; margin-bottom: auto; padding-left: 10px; fill: ${
						$theme === 'dark' ? '#99b3ff' : '#3366ff'
					};`}
				/>
			{/if}

			{#if pokemon.shiny}
				{#if $theme === 'light'}
					<Icon
						name="spark"
						style="margin-top: 0.2rem;"
						lineStroke="var(--text)"
						pathStroke="var(--text)"
					/>
				{:else}
					<Icon
						style="margin-top: 0.2rem;"
						name="spark-full"
						pathFill="var(--text)"
						lineStroke="var(--text)"
						pathStroke="var(--text)"
					/>
				{/if}
			{/if}

			{#if showRemoveButton}
				<button class="removeButton" on:click={onRemoveClick}>-</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	a {
		text-decoration-line: unset;
		border-radius: 10px;
		display: block;
		height: 100%;
		padding: 2rem;
	}

	a > p {
		text-align: center;
		position: relative;
	}

	.card {
		position: relative;
		margin: 1rem;
		text-decoration: none;
		padding: 0;
		max-width: 20%;
		height: auto;
		min-width: 150px;
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
		z-index: 1;
	}

	.indicators {
		position: absolute;
		top: 0;
		left: 0;
		text-align: center;
		height: 2rem;
		width: 100%;
		border-radius: 10%;
		z-index: 1;
		display: inline-flex;
	}

	.spriteWrapper {
		height: 96px;
		width: 96px;
		margin-left: auto;
		margin-right: auto;
	}
</style>
