<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Breadcrumbs from '$components/UI/Breadcrumbs.svelte';
	import Icon from '$components/UI/Icon.svelte';
	import InlineTextButton from '$components/InlineTextButton.svelte';
	import Modal from '$components/UI/Modal.svelte';
	import PokemonCardEntry from '$components/Tags/PokemonCardEntry.svelte';
	import PokemonListEntry from '$components/Tags/PokemonListEntry.svelte';
	import { logError } from '$lib/log';
	import { addNotification } from '$lib/stores/notifications';
	import { currentUser } from '$lib/stores/user';
	import type { ITag, ITagMove, ITagPokemon, TagRecord } from '$lib/types/ITags.js';
	import { onMount } from 'svelte';
	import { getMultiLanguageName } from '$lib/utils/language';
	import { getMoveEntry, getPokemonEntry } from '$lib/data/games.js';
	import { primaryLanguage, secondaryLanguage } from '$lib/stores/domain.js';
	import { termNormaliser } from '$lib/utils/string.js';
	import SocialPreview from '$components/SocialPreview.svelte';
	import MoveCardEntry from '$components/Tags/MoveCardEntry.svelte';
	import MoveListEntry from '$components/Tags/MoveListEntry.svelte';

	export let data;
	$: tags = data;

	let filterTerm = '';
	$: filteredPokemon =
		filterTerm && tags.tag.contents.pokemon
			? tags.tag.contents.pokemon.filter((a) => {
					const normalised = termNormaliser(filterTerm);
					const matchesId = `${a.id}`.includes(filterTerm);
					const names = termNormaliser(
						getMultiLanguageName(
							getPokemonEntry(a.id).names,
							$primaryLanguage,
							$secondaryLanguage,
							a.variety?.name ?? ''
						) ?? ''
					);

					const matchesName = names.includes(normalised);
					return matchesId || matchesName;
			  })
			: tags.tag.contents.pokemon ?? [];

	$: filteredMove =
		filterTerm && tags.tag.contents.move
			? tags.tag.contents.move.filter((move) => {
					const normalised = termNormaliser(filterTerm);
					const matchesId = `${move.id}`.includes(normalised);
					const names = termNormaliser(
						getMultiLanguageName(
							getMoveEntry(move.id).names,
							$primaryLanguage,
							$secondaryLanguage
						) ?? ''
					);

					const matchesName = names.includes(normalised);
					return matchesId || matchesName;
			  })
			: tags.tag.contents.move ?? [];

	$: amountOfItems = Object.keys(tags.tag.contents).reduce((accum, current) => {
		// @ts-ignore cba - we're going over Object.keys
		return accum + tags.tag.contents[current].length;
	}, 0);

	let hasChanges = false;

	let showRenameOverlay = false;
	let showDeleteOverlay = false;
	let inModifyView = false;
	let isLiked = false;

	let displayMode: string = $page.url.searchParams.get('view') ?? 'list';

	let isMounted = false;
	onMount(() => {
		isMounted = true;
	});

	$: {
		if (displayMode && isMounted) {
			const newUrl = new URL($page.url);
			newUrl.searchParams.set('view', displayMode);
			goto(newUrl.toString(), { replaceState: true });
		}
	}

	const saveUpdatedTag = async () => {
		if (hasChanges) {
			try {
				const response = await fetch('/api/tag', {
					method: 'PATCH',
					body: JSON.stringify({
						id: tags.tag.id,
						name: tags.tag.name,
						contents: tags.tag.contents,
						isPrivate: tags.tag.isPrivate,
						showGenderAndShiny: tags.tag.showGenderAndShiny ?? false
					})
				});
				if (response.status !== 200) {
					throw new Error(`Non-200 status code ${response.status}`);
				}

				const newBody = (await response.json()) as ITag;
				tags.tag = {
					...tags.tag,
					...newBody
				};
			} catch (err) {
				addNotification({ message: 'Failed to save tag', level: 'failure' });
				logError(
					'Failed to save tag',
					'FailedToSaveTag',
					`Tag ID: ${data.tag.id}, Name: ${tags.tag.name}, Contents: ${
						tags.tag.contents
					}, Error: ${JSON.stringify(err)}`
				);
			}
		}
	};

	// Needs splitting out
	const removeFromTag = ({ pokemon, move }: { pokemon?: ITagPokemon; move?: ITagMove }) => {
		if (pokemon) {
			tags.tag.contents.pokemon = tags.tag.contents.pokemon?.filter((tagMon) => {
				return !(JSON.stringify(tagMon) === JSON.stringify(pokemon));
			});
		}

		if (move) {
			tags.tag.contents.move = tags.tag.contents.move?.filter((tagMove) => {
				return !(JSON.stringify(tagMove) === JSON.stringify(move));
			});
		}
		hasChanges = true;
	};

	const deleteTag = async () => {
		try {
			await fetch('/api/tags', {
				method: 'DELETE',
				body: JSON.stringify({
					id: tags.tag.id
				})
			});
			addNotification({ message: `Deleted "${tags.tag.name}"`, level: 'success' });
			goto(`/user/${$currentUser?.username}`);
		} catch (err) {
			logError(
				'Failed to delete Tag',
				'FailedToDeleteTag',
				`User: ${$currentUser?.username}, ID: ${tags.tag.id}, Error: ${err}`
			);
			addNotification({
				message: `Failure to delete tag "${tags.tag.name}""`,
				level: 'failure'
			});
		}
	};
</script>

<SocialPreview
	title={`"${tags.tag.name}" tag`}
	description={`${tags.user.username} created this tag with ${
		tags.tag.contents.pokemon ? tags.tag.contents.pokemon.length : 0
	} Pokémon`}
/>

<Breadcrumbs
	breadcrumbs={[
		{
			display: data.user.username,
			url: `/user/${data.user.username}`
		},
		{
			display: data.tag.name
		}
	]}
/>

<div id="tagHeader">
	{#if $currentUser?.username === tags.user.username}
		<button
			class="button"
			style="max-height: 3rem;"
			on:click={async () => {
				if (inModifyView) {
					try {
						await saveUpdatedTag();
					} catch (_) {
						addNotification({ message: 'Failed to save changes', level: 'failure' });
						return;
					}
				}
				inModifyView = !inModifyView;
			}}
		>
			<Icon name={`${inModifyView ? 'floppy' : 'pencil'}`} style="" />
		</button>
	{/if}

	<h1 class="h1" style="padding: 0;">{tags.tag.name}</h1>
	{#if tags.tag.isPrivate}
		<Icon name="lock" style="margin-top: auto; margin-bottom: auto;" />
	{/if}
</div>

{#if inModifyView}
	<div id="modifyWrapper">
		<button class="button" on:click={() => (showRenameOverlay = true)}>Rename</button>
		<button
			class="button"
			on:click={() => {
				tags.tag.showGenderAndShiny = !tags.tag.showGenderAndShiny;
				hasChanges = true;
			}}>{`${tags.tag.showGenderAndShiny ? 'Hide' : 'Show'}`} Variety indicators</button
		>
		<button
			class="button"
			on:click={() => {
				tags.tag.isPrivate = !tags.tag.isPrivate;
				hasChanges = true;
			}}>Make {tags.tag.isPrivate ? 'Public' : 'Private'}</button
		>
		<button
			class="button error"
			on:click={() => {
				showDeleteOverlay = true;
			}}>Delete Tag</button
		>
	</div>
{/if}

<div id="viewOptionsWrapper">
	<div style="display: none;">
		<button class="button" on:click={async () => {}}>Copy</button>
		<button
			class="button"
			on:click={() => {
				isLiked = !isLiked;
			}}><Icon name={isLiked ? 'heart-full' : 'heart'} style="" /></button
		>
	</div>

	<p>View:</p>
	<button
		class={`button ${displayMode === 'list' ? 'selected' : ''}`}
		on:click={() => {
			displayMode = 'list';
		}}><Icon name="list" style="" /></button
	>
	<button
		class={`button ${displayMode === 'card' ? 'selected' : ''}`}
		on:click={() => {
			displayMode = 'card';
		}}><Icon name="card" style="" /></button
	>
</div>

<div id="tagSearchWrapper">
	<input
		style="height: 3rem; padding-left: 2rem;"
		type="text"
		placeholder="Find in tags"
		bind:value={filterTerm}
	/>
</div>

{#if amountOfItems === 0}
	<p>This tag has no items in it</p>
{/if}

<div id="pokemonTagWrapper" style={tags.tag.contents.pokemon?.length === 0 ? 'display: none' : ''}>
	<div class="tagWrapper">
		{#each filteredPokemon.sort((a, b) => (a.id > b.id ? 1 : -1)) as pokemonTag}
			{#if displayMode === 'card'}
				<PokemonCardEntry
					pokemon={pokemonTag}
					showRemoveButton={inModifyView}
					showGenderAndShiny={tags.tag.showGenderAndShiny}
					onRemoveClick={() => {
						removeFromTag({ pokemon: pokemonTag });
					}}
				/>
			{:else}
				<PokemonListEntry
					pokemon={pokemonTag}
					showRemoveButton={inModifyView}
					showGenderAndShiny={tags.tag.showGenderAndShiny}
					onRemoveClick={() => {
						removeFromTag({ pokemon: pokemonTag });
					}}
				/>
			{/if}
		{/each}
	</div>

	{#if tags.tag.contents.pokemon && tags.tag.contents.pokemon.length > 0}
		<div style="display: grid; justify-content: center;">
			<p style="min-width: fit-content;">{tags.tag.contents.pokemon.length} Pokémon</p>
		</div>
	{/if}
</div>

<div
	id="moveTagWrapper"
	class="tagGroup"
	style={tags.tag.contents.move?.length === 0 ? 'display: none' : ''}
>
	<div class="tagWrapper">
		{#each filteredMove.sort((a, b) => (a.id > b.id ? 1 : -1)) as moveTag}
			{#if displayMode === 'card'}
				<MoveCardEntry
					id={moveTag.id}
					showRemoveButton={inModifyView}
					onRemoveClick={() => {
						removeFromTag({ move: moveTag });
					}}
				/>
			{:else}
				<MoveListEntry
					id={moveTag.id}
					showRemoveButton={inModifyView}
					onRemoveClick={() => {
						removeFromTag({ move: moveTag });
					}}
				/>
			{/if}
		{/each}
	</div>

	{#if tags.tag.contents.move && tags.tag.contents.move.length > 0}
		<div style="display: grid; justify-content: center;">
			<p style="min-width: fit-content;">
				{tags.tag.contents.move.length} Move{tags.tag.contents.move.length === 1 ? '' : 's'}
			</p>
		</div>
	{/if}
</div>

<Modal bind:showModal={showRenameOverlay}>
	<h2 class="h2" slot="header">Rename Tag</h2>

	<InlineTextButton
		buttonConfig={{
			text: 'Rename',
			onClick: (newVal) => {
				if (newVal && tags.tag.name !== newVal) {
					tags.tag.name = newVal;
					hasChanges = true;
				}
				showRenameOverlay = false;
			}
		}}
		variation="small"
		containerStyling="padding: 1rem;"
		inputConfig={{ placeholder: 'New name' }}
		valueBinding={tags.tag.name}
	/>
</Modal>

<Modal bind:showModal={showDeleteOverlay}>
	<h2 class="h2" slot="header">Delete Tag</h2>

	<div style="padding-top: 1rem;">
		<p>Are you sure you want to delete this tag and all of its contents?</p>
	</div>

	<div style="display: flex; justify-content: space-between; padding-top: 1rem;">
		<button
			class="button error"
			on:click={async () => {
				showDeleteOverlay = false;
				await deleteTag();
			}}
		>
			Yes, delete
		</button>

		<button
			class="button"
			on:click={() => {
				showDeleteOverlay = false;
			}}
		>
			No, cancel
		</button>
	</div>
</Modal>

<style>
	.tagWrapper {
		display: flex;
		flex-wrap: wrap;
		padding: 0;
		justify-content: space-around;
	}

	#tagHeader {
		display: inline-flex;
		padding-bottom: 1rem;
		gap: 0.5rem;
		width: 100%;
	}

	#modifyWrapper > button {
		margin-bottom: 1rem;
	}

	#viewOptionsWrapper {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
	}

	#tagSearchWrapper {
		margin-top: 1rem;
		margin-bottom: 1rem;
		display: flex;
		justify-content: center;
	}

	@media (max-width: 768px) {
		#tagSearchWrapper > input {
			width: 100%;
		}
	}
</style>
