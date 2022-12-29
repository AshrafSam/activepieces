// // import the interface

import { CollectionActions } from '../action/collection.action';
import { UUID } from 'angular2-uuid';
import { Action, createReducer, on } from '@ngrx/store';
import { VersionEditState } from '../../../common/model/enum/version-edit-state.enum';
import { CollectionStateEnum } from '../model/enums/collection-state.enum';
import { CollectionState } from '../model/collection-state.model';
import { Collection } from 'src/app/modules/common/model/collection.interface';
import { FlowsActions } from '../action/flows.action';

const initialState: CollectionState = {
	state: CollectionStateEnum.NONE,
	lastSaveRequestId: UUID.UUID(),
	collection: {
		last_version: {
			id: '',
			display_name: 'dummy',
			state: VersionEditState.DRAFT,
			configs: [],
			flowsVersionId: [],
			created: 0,
			updated: 0,
		},
		created: 0,
		updated: 0,
		id: '',
		name: 'dummy',
		project_id: 'dummy',
		versionsList: [],
	},
	instance: undefined,
};
const _collectionReducer = createReducer(
	initialState,
	on(CollectionActions.setInitial, (state, { collection, instance }): CollectionState => {
		const clonedPiece: Collection = JSON.parse(JSON.stringify(collection));
		return { collection: clonedPiece, state: CollectionStateEnum.NONE, instance: instance };
	}),
	on(CollectionActions.changeName, (state, { displayName }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		clonedState.collection.last_version.display_name = displayName;
		clonedState.state |= CollectionStateEnum.SAVING_COLLECTION;
		return clonedState;
	}),
	on(CollectionActions.savedSuccess, (state, { collection }): CollectionState => {
		const clonedPiece: Collection = JSON.parse(JSON.stringify(collection));
		return { collection: clonedPiece, state: CollectionStateEnum.NONE };
	}),
	on(CollectionActions.savedFailed, (state, { error }): CollectionState => {
		const clonedPiece: Collection = JSON.parse(JSON.stringify(state.collection));
		console.error(error);
		return { collection: clonedPiece, state: CollectionStateEnum.FAILED_SAVING_OR_DEPLOYING };
	}),

	on(CollectionActions.addConfig, (state, { config }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		clonedState.collection.last_version.configs.push(config);
		clonedState.state |= CollectionStateEnum.SAVING_COLLECTION;
		return clonedState;
	}),
	on(CollectionActions.deleteConfigSucceeded, (state, { configIndex: index }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		clonedState.collection.last_version.configs.splice(index, 1);
		clonedState.state |= CollectionStateEnum.SAVING_COLLECTION;
		return clonedState;
	}),
	on(CollectionActions.updateConfig, (state, { configIndex, config }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		clonedState.collection.last_version.configs[configIndex] = config;
		clonedState.state |= CollectionStateEnum.SAVING_COLLECTION;
		return clonedState;
	}),
	on(CollectionActions.deploy, (state): CollectionState => {
		return { ...state, state: CollectionStateEnum.DEPLOYING | state.state };
	}),
	on(CollectionActions.deployFailed, (state): CollectionState => {
		return { ...state, state: CollectionStateEnum.FAILED_SAVING_OR_DEPLOYING };
	}),
	on(CollectionActions.deploySuccess, (state, props): CollectionState => {
		return { ...state, state: state.state & ~CollectionStateEnum.DEPLOYING, instance: props.instance };
	}),
	on(FlowsActions.saveFlowStarted, (state, { flow, saveRequestId }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));

		return {
			...clonedState,
			state: clonedState.state | CollectionStateEnum.SAVING_FLOW,
			lastSaveRequestId: saveRequestId,
		};
	}),
	on(FlowsActions.deleteFlowStarted, (state, { flowId, saveRequestId }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		return {
			...clonedState,
			state: clonedState.state | CollectionStateEnum.SAVING_FLOW,
			lastSaveRequestId: saveRequestId,
		};
	}),
	on(FlowsActions.savedFailed, (state, {}): CollectionState => {
		return { ...state, state: CollectionStateEnum.FAILED_SAVING_OR_DEPLOYING };
	}),
	on(FlowsActions.savedSuccess, (state, { saveRequestId, flow }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		//in case a new version was created after the former one was locked.
		const saving_deploying_state =
			saveRequestId === clonedState.lastSaveRequestId
				? clonedState.state & ~CollectionStateEnum.SAVING_FLOW
				: clonedState.state;
		return { ...clonedState, state: saving_deploying_state };
	}),
	on(CollectionActions.removeInstance, (state): CollectionState => {
		return { ...state, instance: undefined };
	}),
	on(FlowsActions.deleteSuccess, (state, { saveRequestId }): CollectionState => {
		return {
			...state,
			state: state.lastSaveRequestId === saveRequestId ? state.state & ~CollectionStateEnum.SAVING_FLOW : state.state,
		};
	})
);

export function collectionReducer(state: CollectionState | undefined, action: Action) {
	return _collectionReducer(state, action);
}