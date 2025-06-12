import { writable } from 'svelte/store';
import type { User, Profile } from '$lib/types';

export interface AuthState {
	user: User | null;
	profile: Profile | null;
	loading: boolean;
	initialized: boolean;
}

const initialState: AuthState = {
	user: null,
	profile: null,
	loading: true,
	initialized: false
};

export const authStore = writable<AuthState>(initialState);

export const authActions = {
	setUser: (user: User | null, profile: Profile | null = null) => {
		authStore.update(state => ({
			...state,
			user,
			profile,
			loading: false,
			initialized: true
		}));
	},
	
	setProfile: (profile: Profile) => {
		authStore.update(state => ({
			...state,
			profile
		}));
	},
	
	setLoading: (loading: boolean) => {
		authStore.update(state => ({
			...state,
			loading
		}));
	},
	
	logout: () => {
		authStore.set({
			user: null,
			profile: null,
			loading: false,
			initialized: true
		});
	},
	
	initialize: () => {
		authStore.update(state => ({
			...state,
			initialized: true,
			loading: false
		}));
	}
};
