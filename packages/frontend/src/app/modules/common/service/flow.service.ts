import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { forkJoin, map, Observable, of, skipWhile, switchMap, take } from 'rxjs';
import {
	CollectionId,
	CreateFlowRequest,
	CreateFlowRunRequest,
	ExecutionOutputStatus,
	ExecutionState,
	FileId,
	Flow,
	FlowId,
	FlowOperationRequest,
	FlowRun,
	FlowVersionId,
	SeekPage,
	TriggerType,
} from 'shared';
import { BuilderSelectors } from '../../flow-builder/store/selector/flow-builder.selector';
import { findDefaultFlowDisplayName } from '../utils';
import { Store } from '@ngrx/store';
import { FlowsActions } from '../../flow-builder/store/action/flows.action';
import { RightSideBarType } from '../model/enum/right-side-bar-type.enum';
@Injectable({
	providedIn: 'root',
})
export class FlowService {
	constructor(private store: Store, private http: HttpClient) {}

	createEmptyFlow() {
		return forkJoin({
			collection: this.store.select(BuilderSelectors.selectCurrentCollection).pipe(take(1)),
			flows: this.store.select(BuilderSelectors.selectFlows).pipe(take(1)),
		})
			.pipe(
				switchMap(collectionWIthFlows => {
					const flowDisplayName = findDefaultFlowDisplayName(collectionWIthFlows.flows);
					return this.create({ collectionId: collectionWIthFlows.collection.id, displayName: flowDisplayName });
				})
			)
			.pipe(
				map(response => {
					if (response != undefined) {
						this.store
							.select(BuilderSelectors.selectCurrentFlowId)
							.pipe(skipWhile(f => f != response.id))
							.pipe(take(1))
							.pipe(
								switchMap(f => {
									return this.store
										.select(BuilderSelectors.selectCurrentTabState)
										.pipe(skipWhile(f => f == undefined))
										.pipe(take(1));
								})
							)
							.subscribe(tab => {
								if (response.version!.trigger?.type === TriggerType.EMPTY) {
									this.store.dispatch(
										FlowsActions.setRightSidebar({
											sidebarType: RightSideBarType.TRIGGER_TYPE,
											props: {},
										})
									);
								}
							});
						this.store.dispatch(FlowsActions.addFlow({ flow: response }));
					}
					return response;
				})
			);
	}

	create(request: CreateFlowRequest): Observable<Flow> {
		return this.http.post<Flow>(environment.apiUrl + '/flows', {
			displayName: request.displayName,
			collectionId: request.collectionId,
		});
	}

	get(flowId: FlowId, flowVersionId: undefined | FlowVersionId): Observable<Flow> {
		let params = {};
		if (flowVersionId) {
			params['versionId'] = flowVersionId;
		}
		return this.http.get<Flow>(environment.apiUrl + '/flows/' + flowId, {
			params: params,
		});
	}

	delete(flowId: FlowId): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + '/flows/' + flowId);
	}

	listByCollection(collectionId: CollectionId): Observable<SeekPage<Flow>> {
		return this.http.get<SeekPage<Flow>>(environment.apiUrl + '/flows', {
			params: {
				limit: 100000,
				collectionId: collectionId,
			},
		});
	}

	update(flowId: FlowId, opreation: FlowOperationRequest): Observable<Flow> {
		return this.http.post<Flow>(environment.apiUrl + '/flows/' + flowId, opreation);
	}

	execute(request: CreateFlowRunRequest): Observable<FlowRun> {
		return this.http.post<FlowRun>(environment.apiUrl + '/flow-runs', request).pipe(
			switchMap(run => {
				if (run.status !== ExecutionOutputStatus.RUNNING && run.logsFileId !== null) {
					return this.loadStateLogs(run.logsFileId).pipe(
						map(state => {
							return { ...run, state: state };
						})
					);
				}
				return of(run);
			})
		);
	}

	loadStateLogs(fileId: FileId): Observable<ExecutionState> {
		return this.http.get<ExecutionState>(environment.apiUrl + `/files/${fileId}`);
	}
}
