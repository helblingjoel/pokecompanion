import type { Name, VersionGroup } from './IPokemon';

export interface IMove {
	accuracy: number | null;
	contest_combos: {
		normal: {
			use_after: unknown | null;
			use_before: {
				name: string;
				url: string;
			}[];
		};
	};
	contest_effect: {
		url: string;
	};
	contest_type: {
		name: string;
		url: string;
	};
	damage_class: {
		name: string;
		url: string;
	};
	effect_chance: number;
	effect_changes: unknown[];
	effect_entries: {
		effect: string;
		short_effect: string;
		language: {
			name: string;
			url: string;
		};
	}[];
	flavor_text_entries: {
		flavor_text: string;
		language: {
			name: string;
			url: string;
		};
		version_group: {
			name: string;
			url: string;
		};
	}[];
	generation: {
		name: string;
		url: string;
	};
	id: number;
	learned_by_pokemon: {
		name: string;
		url: string;
	}[];
	machines: {
		machine: {
			name: string;
			url: string;
		};
		version_group: VersionGroup;
	}[];
	meta: {
		ailment: {
			name: string;
			url: string;
		};
		ailment_chance: number;
		category: {
			name: string;
			url: string;
		};
		crit_rate: number;
		drain: number;
		flinch_chance: number;
		healing: number;
		max_hits: number;
		max_turns: number;
		min_hits: number;
		min_turns: number;
		stat_chance: number;
	};
	name: string;
	names: Name[];
	past_values: unknown[];
	power: unknown | null;
	pp: number;
	priority: number;
	stat_changes: unknown[];
	super_contest_effect: {
		url: string;
	};
	target: {
		name: string;
		url: string;
	};
	type: {
		name: string;
		url: string;
	};
}