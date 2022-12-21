import {createComponent} from '../../framework/component';
import { enrichNewLead } from './actions/enrich-new-lead-body.action';
import { newLeads } from './triggers/new-leads.trigger';

export const facebook = createComponent({
	name: 'facebook',
	displayName: "Facebook",
	logoUrl: 'https://cdn.activepieces.com/components/facebook/logo.png',
	actions: [enrichNewLead],
	triggers: [newLeads],
});
