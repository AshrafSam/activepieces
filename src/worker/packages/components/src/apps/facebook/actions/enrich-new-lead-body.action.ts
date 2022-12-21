import {createAction} from '../../../framework/action/action';
import {ConfigurationValue} from "../../../framework/config/configuration-value.model";

export const enrichNewLead = createAction({
	name: 'enrich_new_lead',
	displayName: "Enrich New Lead",
	description: 'Enrich New Lead',
	configs: [
	],
	async runner(configValue: ConfigurationValue) {
		

		return {
			success: true,
			
		};
	},
});
