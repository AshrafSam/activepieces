import {slack} from './slack';
import type {Component} from '../framework/component';
import { gmail } from './gmail';
import { facebook } from './facebook';
import { googleSheets } from './google-sheets';

export const apps: Component[] = [
	slack,
	gmail,
	facebook,
	googleSheets
];
