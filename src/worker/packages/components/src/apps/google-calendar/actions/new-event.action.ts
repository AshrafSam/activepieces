import { AuthenticationType } from '../../../common/authentication/core/authentication-type';
import { httpClient } from '../../../common/http/core/http-client';
import { HttpMethod } from '../../../common/http/core/http-method';
import { createAction } from '../../../framework/action/action';
import { InputType } from '../../../framework/config/input-type.model';

const API = 'https://www.googleapis.com/calendar/v3';

type Calendar = {
    id: string,
    summary: string,
}

type Page<T> = {
    items: T[],
}

export const googleCalendarActionNewEvent = createAction({
    name: 'new_event',
    displayName: 'New Event',
    description: 'Create a new event on a calendar',
    configs: [
        {
            name: 'authentication',
            displayName: 'Authentication',
            description: 'Authentication',
            type: InputType.OAUTH2,
            authUrl: 'https://accounts.google.com/o/oauth2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            required: true,
            scopes: [
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/calendar.readonly',
            ]
        },
        {
            name: 'summary',
            displayName: 'summary',
            description: 'Event title',
            required: false,
            type: InputType.SHORT_TEXT,
        },
        {
            name: 'start',
            displayName: 'start',
            description: 'Start time in ISO format',
            required: true,
            type: InputType.SHORT_TEXT,
        },
        {
            name: 'end',
            displayName: 'end',
            description: 'end time in ISO format',
            required: true,
            type: InputType.SHORT_TEXT,
        },
        {
            name: 'calendarId',
            displayName: 'Calendar',
            description: 'Calendar to create event in',
            required: true,
            type: InputType.SELECT,
            async options(config) {
                const calendars: Page<Calendar> = await httpClient.sendRequest({
                    method: HttpMethod.GET,
                    url: `${API}/users/me/calendarList`,
                    authentication: {
                        type: AuthenticationType.BEARER_TOKEN,
                        token: config.authentication.access_token,
                    },
                });

                return calendars.items.map(calendar => ({
                    label: calendar.summary,
                    value: calendar.id,
                }));
            },
        },
    ],
    runner: async (config) => ({ success: true }),
});
