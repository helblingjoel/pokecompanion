<script lang="ts">
	import type { IStaticPokemon } from '$lib/data/games';
	import PokemonPreview from './PokemonPreview.svelte';

	export let pokemons: IStaticPokemon[];
	export let title: string;
	export let secondaryTitle: string;
	export let isHidden: boolean;

	const toggleVisibility = (id: string) => {
		isHidden = !isHidden;
		const target = document.getElementById(id);
		if (target) {
			target.classList.toggle('hidden');
		}
	};
</script>

<button
	style="width: 100%;"
	class="toggle pokemonGrouping"
	on:click={() => {
		toggleVisibility(title + '-list');
	}}
>
	<div style="display: flex; justify-content: space-between; padding: 2rem;">
		<h2 class="h2">{title}</h2>
		{#if secondaryTitle}
			<h2 class="h2">{secondaryTitle}</h2>
		{/if}
	</div>
</button>

<div id={`${title}-list`} class={isHidden ? 'hidden' : ''}>
	{#each pokemons as pokemon}
		<PokemonPreview {pokemon} />
	{/each}
</div>

<style>
	button.pokemonGrouping:not(:first-child) {
		margin-top: 2rem;
	}
</style>
