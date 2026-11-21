import { afterEach, describe, expect, it, vi } from 'vitest';
import { addDays, todayIn } from '../src/data';
import { PeckListCard } from '../src/pecklist-card';
import type { CardConfig } from '../src/types';
import { type FakeHass, household } from './fake-hass';

const TODAY = todayIn('America/Chicago');

async function settle(card: PeckListCard): Promise<void> {
	for (let i = 0; i < 6; i++) {
		await new Promise((resolve) => setTimeout(resolve, 0));
		await card.updateComplete;
	}
}

async function mount(config: Partial<CardConfig> = {}, hass: FakeHass = household(TODAY)): Promise<{ card: PeckListCard; hass: FakeHass; root: ShadowRoot }> {
	const card = document.createElement('pecklist-card') as PeckListCard;
	card.setConfig({ type: 'custom:pecklist-card', ...config });
	card.hass = hass;
	document.body.append(card);
	await settle(card);
	return { card, hass, root: card.shadowRoot! };
}

const text = (root: ShadowRoot | Element, selector: string) => [...root.querySelectorAll(selector)].map((e) => e.textContent!.replace(/\s+/gu, ' ').trim());
const writes = (hass: FakeHass) => hass.calls.filter((c) => String(c.type).startsWith('pecklist/task/'));
const row = (root: ShadowRoot, title: string) => [...root.querySelectorAll('.row')].find((r) => r.querySelector('.name')!.textContent === title)!;

afterEach(() => {
	// happy-dom's ShadowRoot.activeElement throws once the focused element is gone: let go of it first.
	let active = document.activeElement as HTMLElement | null;
	while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement as HTMLElement;
	active?.blur?.();
	document.body.replaceChildren();
});

function pointer(type: string, target: Element, x: number, y: number, pointerType = 'mouse'): void {
	target.dispatchEvent(new PointerEvent(type, { bubbles: true, composed: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType, button: 0 }));
}
const chipOf = (root: ShadowRoot, title: string) => [...root.querySelectorAll('.ctask')].find((c) => c.textContent!.includes(title)) as HTMLElement;
/** Where the browser would find the pointer: the test says which calendar day it is over. */
function over(root: ShadowRoot, cell: () => Element | null): void {
	(root as unknown as { elementFromPoint: () => Element | null }).elementFromPoint = cell;
}
/** A calendar day next to today, in the same grid. */
function besideToday(root: ShadowRoot): HTMLElement {
	const cells = [...root.querySelectorAll('.cday')] as HTMLElement[];
	const at = cells.findIndex((c) => c.dataset.day === TODAY);
	return cells[at === cells.length - 1 ? at - 1 : at + 1]!;
}

describe('the card', () => {
	it('registers itself for the card picker', () => {
		expect(customElements.get('pecklist-card')).toBe(PeckListCard);
		expect((window as unknown as { customCards: { type: string }[] }).customCards.map((c) => c.type)).toContain('pecklist-card');
		expect(PeckListCard.getConfigElement().localName).toBe('pecklist-card-editor');
		expect(() => new PeckListCard().setConfig({ type: 'x', view: 'kanban' as never })).toThrow(/Unknown view/u);
	});

	it("shows the signed-in person's own account at a glance", async () => {
		const { root, hass } = await mount({ title: 'Tasks' });
		expect(hass.calls.filter((c) => c.type === 'pecklist/subscribe').map((c) => c.entry_id)).toEqual(['ben']);
		expect(text(root, 'h2')).toEqual(['Tasks']);
		expect(text(root, '.count')).toEqual(['2 Overdue', '2 Today', '9 Upcoming']);
		expect(text(root, '.name')).toEqual(['Book the plumber', 'Chart update', 'Take out the bins', 'Empty the dishwasher', 'Groceries']);
		const late = text(root, '.meta .late');
		expect(late).toHaveLength(2);
		expect(late[1]).toBe('Yesterday');
		expect(root.querySelector('.people')).toBeNull();
	});

	it('a count filters the list below it', async () => {
		const { card, root } = await mount();
		(root.querySelector('.count.late') as HTMLElement).click();
		await settle(card);
		expect(text(root, '.name')).toEqual(['Book the plumber', 'Chart update']);
	});

	it('checks a task off in one tap, and reopens it', async () => {
		const { card, root, hass } = await mount({ show_completed: true, view: 'list', lists: ['chores'] });
		const check = () => row(root, 'Empty the dishwasher').querySelector('.check') as HTMLButtonElement;
		expect(check().getAttribute('aria-checked')).toBe('false');
		check().click();
		await card.updateComplete;
		expect(check().getAttribute('aria-checked')).toBe('true'); // at once, before the server answers
		await settle(card);
		expect(writes(hass)).toEqual([{ type: 'pecklist/task/complete', entry_id: 'ben', task_id: 'b1' }]);
		expect(check().getAttribute('aria-checked')).toBe('true');
		check().click();
		await settle(card);
		expect(writes(hass)[1]).toEqual({ type: 'pecklist/task/reopen', entry_id: 'ben', task_id: 'b1' });
		expect(check().getAttribute('aria-checked')).toBe('false');
	});

	it('a refused change puts the check back and says why', async () => {
		const { card, root, hass } = await mount();
		hass.fail = 'The API key may only read tasks.';
		(row(root, 'Chart update').querySelector('.check') as HTMLElement).click();
		await settle(card);
		expect(row(root, 'Chart update').querySelector('.check')!.getAttribute('aria-checked')).toBe('false');
		expect(text(root, '.problem')).toEqual(['The API key may only read tasks.']);
	});

	it('list view groups by list and section, with subtasks under their parent', async () => {
		const { root } = await mount({ view: 'list' });
		expect(text(root, 'h3')).toEqual(['Inbox', 'Chores · Inside', 'Chores · Outside', 'Flying', 'Household']);
		expect(text(root, 'ul ul .name')).toEqual(['Coffee beans', 'Milk']);
	});

	it('agenda view runs from overdue through the days ahead', async () => {
		const { root } = await mount({ view: 'agenda', days: 2 });
		expect(text(root, 'h3').map((h) => h.split(' · ')[0])).toEqual(['Overdue', 'Today', 'Tomorrow', expect.any(String)]);
	});

	it('heatmap view shades days, and a tap shows that day', async () => {
		const { card, root } = await mount({ view: 'heatmap' });
		const cells = [...root.querySelectorAll('.cell:not(.out)')] as HTMLElement[];
		expect(cells.length).toBeGreaterThanOrEqual(28);
		expect(root.querySelector('.cell.today')!.getAttribute('aria-pressed')).toBe('true');
		expect(text(root, '.name')).toEqual(['Take out the bins', 'Empty the dishwasher']);
		const busiest = cells.reduce((a, b) => (Number(b.style.getPropertyValue('--level')) > Number(a.style.getPropertyValue('--level')) ? b : a));
		expect(busiest.getAttribute('aria-label')).toMatch(/: 4 tasks$/u);
		busiest.click();
		await settle(card);
		expect(text(root, '.name')).toHaveLength(4);
		const label = text(root, '.nav strong')[0];
		(root.querySelector('[aria-label="Later"]') as HTMLElement).click();
		await settle(card);
		expect(text(root, '.nav strong')[0]).not.toBe(label);
	});

	it('several people: combined with a color each, and a button per person', async () => {
		const { card, root, hass } = await mount({
			entries: ['ben', 'sam'],
			view: 'list',
			lists: ['household', 'garden'],
			person_colors: { sam: '#123456' },
		});
		const whose = (title: string) => row(root, title).querySelector('.who');
		const colors = (title: string) => [...whose(title)!.querySelectorAll('i')].map((i) => i.style.background.toLowerCase());
		expect(hass.subscribers()).toBe(2);
		// Each button counts that person's open tasks.
		expect(text(root, '.chip')).toEqual(['All 7', 'Ben 4', 'Sam 6']);
		expect(root.querySelector('.chip')!.getAttribute('aria-pressed')).toBe('true');
		expect(text(root, '.name').filter((n) => n === 'Take out the bins')).toHaveLength(1);
		expect(text(root, 'h3')).toEqual(['Household', 'Garden']);
		// A stripe says whose task it is: the person it is assigned to, else everyone who can see it.
		expect(whose('Take out the bins')!.getAttribute('aria-label')).toBe('Sam');
		expect(whose('Book the plumber')!.getAttribute('aria-label')).toBe('Ben');
		expect(whose('Groceries')!.getAttribute('aria-label')).toBe('Ben, Sam');
		expect(colors('Groceries')).toEqual(['#4c8bf5', '#123456']);

		// Ben's button: only his, with no stripes to read.
		(root.querySelectorAll('.chip')[1] as HTMLElement).click();
		await settle(card);
		expect(text(root, 'h3')).toEqual(['Household']);
		expect(text(root, '.name')).toEqual(['Book the plumber', 'Groceries', 'Coffee beans', 'Milk']);
		expect(root.querySelector('.who')).toBeNull();
		// Tapping it again goes back to everyone.
		(root.querySelectorAll('.chip')[1] as HTMLElement).click();
		await settle(card);
		expect(text(root, 'h3')).toEqual(['Household', 'Garden']);
	});

	it("one person's button also narrows where quick add can put a task", async () => {
		const { card, root } = await mount({ entries: ['ben', 'sam'], quick_add: true, lists: ['chores', 'garden'] });
		const options = () => [...root.querySelectorAll('.add option')].map((o) => o.textContent);
		expect(options()).toEqual(['ben: Chores', 'sam: Garden']);
		(root.querySelectorAll('.chip')[2] as HTMLElement).click();
		await settle(card);
		expect(options()).toEqual(['Garden']);
		expect((root.querySelector('.add select') as HTMLSelectElement).hidden).toBe(true); // one place: no choice to make
	});

	it('quick add sends the line to the list the card is about', async () => {
		const { card, root, hass } = await mount({ quick_add: true, lists: ['chores'], view: 'list' });
		const input = root.querySelector('.add input') as HTMLInputElement;
		input.value = 'Sweep the porch today #home !high';
		root.querySelector('.add')!.dispatchEvent(new Event('submit', { cancelable: true }));
		await settle(card);
		expect(writes(hass)).toEqual([{ type: 'pecklist/task/quick_add', entry_id: 'ben', text: 'Sweep the porch today #home !high', list_id: 'chores' }]);
		expect(input.value).toBe('');
		expect(text(root, '.name')).toContain('Sweep the porch');
	});

	it('editing sends only the fields that changed', async () => {
		const { card, root, hass } = await mount({ view: 'list', lists: ['chores'] });
		(row(root, 'Mow the lawn').querySelector('.what') as HTMLElement).click();
		await settle(card);
		const form = root.querySelector('.scrim form')!;
		const [title, date] = form.querySelectorAll('input');
		expect([title!.value, date!.value]).toEqual(['Mow the lawn', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/u)]);
		title!.value = 'Mow the front lawn';
		title!.dispatchEvent(new Event('input'));
		(form.querySelectorAll('.prio button')[3] as HTMLElement).click();
		await settle(card);
		form.dispatchEvent(new Event('submit', { cancelable: true }));
		await settle(card);
		expect(writes(hass)).toEqual([
			{ type: 'pecklist/task/update', entry_id: 'ben', task_id: 'b2', changes: { title: 'Mow the front lawn', priority: 3 } },
		]);
		expect(root.querySelector('.scrim')).toBeNull();
		expect(text(root, '.name')).toContain('Mow the front lawn');
	});

	it('deleting from the dialog', async () => {
		const { card, root, hass } = await mount({ view: 'list', lists: ['chores'] });
		(row(root, 'Rake leaves').querySelector('.what') as HTMLElement).click();
		await settle(card);
		(root.querySelector('.btn.danger') as HTMLElement).click();
		await settle(card);
		expect(writes(hass)).toEqual([{ type: 'pecklist/task/delete', entry_id: 'ben', task_id: 'b10' }]);
		expect(text(root, '.name')).not.toContain('Rake leaves');
	});

	it('a list you may only view cannot be checked or edited', async () => {
		const hass = household(TODAY);
		hass.people[0]!.lists.find((l) => l.id === 'household')!.role = 'viewer';
		const { card, root } = await mount({ view: 'list', lists: ['household'] }, hass);
		const bins = row(root, 'Take out the bins');
		expect((bins.querySelector('.check') as HTMLButtonElement).disabled).toBe(true);
		(bins.querySelector('.what') as HTMLElement).click();
		await settle(card);
		expect(root.querySelector('.scrim')).toBeNull();
	});

	it('wall tablet layout adds through Assist, with no text box', async () => {
		const { card, root } = await mount({ kiosk: true, quick_add: true });
		expect(card.hasAttribute('kiosk')).toBe(true);
		expect(root.querySelector('.add')).toBeNull();
		const heard = vi.fn();
		document.body.addEventListener('hass-action', (e) => heard((e as CustomEvent).detail));
		(root.querySelector('.voice') as HTMLElement).click();
		expect(heard).toHaveBeenCalledWith({ config: { tap_action: { action: 'assist', start_listening: true } }, action: 'tap' });
	});

	it('stops listening when it leaves the page, and starts again when it is back', async () => {
		const { card, hass } = await mount();
		expect(hass.subscribers()).toBe(1);
		card.remove();
		expect(hass.subscribers()).toBe(0);
		document.body.append(card);
		await settle(card);
		expect(hass.subscribers()).toBe(1);
	});

	it('says so when the integration is missing', async () => {
		const hass = household(TODAY);
		hass.callWS = () => Promise.reject({ code: 'unknown_command', message: 'Unknown command.' });
		const { root } = await mount({}, hass);
		expect(text(root, '.problem')[0]).toMatch(/integration is not set up/u);
	});
	it('a compact card folds the add box behind a + button', async () => {
		const { card, root } = await mount({ quick_add: true, density: 'compact', lists: ['chores'] });
		const add = () => root.querySelector('.add') as HTMLFormElement;
		expect(add().hidden).toBe(true);
		// One person: no person buttons, only the +.
		expect(root.querySelectorAll('.chip')).toHaveLength(1);
		const plus = root.querySelector('.chip.plus') as HTMLElement;
		expect(plus.getAttribute('aria-expanded')).toBe('false');
		plus.click();
		await settle(card);
		expect(plus.getAttribute('aria-expanded')).toBe('true');
		expect(add().hidden).toBe(false);
		plus.click();
		await settle(card);
		expect(add().hidden).toBe(true);
	});
	it('names an assignee who is not on the card, and assigns from the dialog', async () => {
		const { card, root, hass } = await mount({ view: 'list', lists: ['household', 'chores'] });
		// Ben's own card: the bins are Sam's to take out.
		expect(text(row(root, 'Take out the bins'), '.meta .to')).toEqual(['@Sam']);
		expect(text(row(root, 'Book the plumber'), '.meta .to')).toEqual([]);

		// A task in a shared list can be assigned; one in a list of your own has nobody to assign to.
		(row(root, 'Mow the lawn').querySelector('.what') as HTMLElement).click();
		await settle(card);
		expect(root.querySelector('.assign')).toBeNull();
		(root.querySelector('.scrim .btn:not(.danger):not(.primary)') as HTMLElement).click();
		await settle(card);

		(row(root, 'Groceries').querySelector('.what') as HTMLElement).click();
		await settle(card);
		const chips = [...root.querySelectorAll('.assign .chip')] as HTMLElement[];
		expect(chips.map((c) => [c.textContent!.trim(), c.getAttribute('aria-pressed')])).toEqual([
			['Me', 'false'],
			['Sam', 'false'],
		]);
		chips[1]!.click();
		await settle(card);
		root.querySelector('.scrim form')!.dispatchEvent(new Event('submit', { cancelable: true }));
		await settle(card);
		expect(writes(hass)).toEqual([
			{ type: 'pecklist/task/update', entry_id: 'ben', task_id: 'h3', changes: { assignees: ['user:u-sam'] } },
		]);
		expect(text(row(root, 'Groceries'), '.meta .to')).toEqual(['@Sam']);
	});
	it('week strip: seven days with a dot per open task, and a tap lists the day', async () => {
		const { card, root } = await mount({ view: 'week', entries: ['ben', 'sam'] });
		const days = [...root.querySelectorAll('.wday')] as HTMLElement[];
		expect(days).toHaveLength(7);
		expect(days[0]!.getAttribute('aria-pressed')).toBe('true');
		expect(days[0]!.classList.contains('today')).toBe(true);
		// Today: Ben's dishwasher, Sam's bins and tulip bulbs, each dot in its person's color.
		const dots = [...days[0]!.querySelectorAll('.dots i')] as HTMLElement[];
		expect(dots).toHaveLength(3);
		expect(new Set(dots.map((d) => d.style.background.toLowerCase()))).toEqual(new Set(['#4c8bf5', '#e0679a']));
		// Today also shows what is overdue; another day shows only its own.
		expect(text(root, 'h3')[0]).toBe('Overdue');
		days[2]!.click();
		await settle(card);
		expect(text(root, 'h3')).toHaveLength(1);
		expect(text(root, '.name')).toEqual(['Pay the water bill', 'Mow the lawn', 'Rake leaves', 'Replace furnace filter']);
		// A busy day says how many more than it has dots for.
		expect(days[2]!.querySelector('.dots em')).toBeNull();
		expect(days[2]!.getAttribute('aria-label')).toMatch(/: 4 tasks$/u);
	});

	it('next up: the most pressing task, done or put off in one tap', async () => {
		const { card, root, hass } = await mount({ view: 'next' });
		expect(text(root, '.hero-title')).toEqual(['Book the plumber']);
		expect(text(root, '.hero-more')).toEqual(['3 more due']);
		const [done, tomorrow] = [...root.querySelectorAll('.hero-actions .btn')] as HTMLElement[];
		tomorrow!.click();
		await settle(card);
		const moved = writes(hass)[0] as { type: string; changes: { due: { at: string } } };
		expect(moved.type).toBe('pecklist/task/update');
		expect(moved.changes.due.at > TODAY).toBe(true);
		expect(text(root, '.hero-title')).toEqual(['Chart update']);
		(root.querySelector('.hero-actions .btn.primary') as HTMLElement).click();
		await settle(card);
		expect(writes(hass)[1]).toEqual({ type: 'pecklist/task/complete', entry_id: 'ben', task_id: 'b6' });
		expect(text(root, '.hero-title')).toEqual(['Take out the bins']);
		expect(done).toBeTruthy();
	});

	it('family board: a column per person with their own tasks', async () => {
		const { root } = await mount({ view: 'board', entries: ['ben', 'sam'], lists: ['household', 'garden'] });
		expect(text(root, '.col h3')).toEqual(['Ben 4', 'Sam 6']);
		const columns = [...root.querySelectorAll('.col')];
		expect(text(columns[0]!, '.name')).toEqual(['Book the plumber', 'Groceries', 'Coffee beans', 'Milk']);
		expect(text(columns[1]!, '.name')).toContain('Take out the bins');
		// Columns say whose it is: no buttons and no stripes.
		expect(root.querySelector('.people')).toBeNull();
		expect(root.querySelector('.who')).toBeNull();
	});

	it('shopping list: ticked things drop to the bottom, and Clear takes them away', async () => {
		const { card, root, hass } = await mount({ view: 'shopping', lists: ['chores'] });
		expect(card.getAttribute('view')).toBe('shopping');
		expect(text(root, 'h3')).toEqual(['Inside', 'Outside', 'Done Clear 1']);
		(row(root, 'Rake leaves').querySelector('.check') as HTMLElement).click();
		await settle(card);
		expect(text(root, '.clear')).toEqual(['Clear 2']);
		(root.querySelector('.clear') as HTMLElement).click();
		await settle(card);
		expect(writes(hass).slice(1).map((w) => [w.type, w.task_id]).sort()).toEqual([
			['pecklist/task/delete', 'b10'],
			['pecklist/task/delete', 'b8'],
		]);
		expect(root.querySelector('.clear')).toBeNull();
		expect(text(root, '.name')).not.toContain('Rake leaves');
	});

	it('person tiles: counts per person, and a tap goes where the card says', async () => {
		const { card, root } = await mount({ view: 'tiles', entries: ['ben', 'sam'], navigation_path: '/tasks/home', quick_add: true });
		expect(text(root, '.tile')).toEqual(['Ben 1 today 2 late', 'Sam 2 today']);
		expect(root.querySelector('.add')).toBeNull();
		expect(root.querySelector('.people')).toBeNull();
		expect(card.getGridOptions().rows).toBe(1);
		const went = vi.fn();
		window.addEventListener('location-changed', went);
		(root.querySelector('.tile') as HTMLElement).click();
		expect(went).toHaveBeenCalledOnce();
		expect(location.pathname).toBe('/tasks/home');
	});

	it('moves a task to another list from the dialog, its subtasks with it', async () => {
		const { card, root, hass } = await mount({ view: 'list', lists: ['household', 'chores'] });
		(row(root, 'Groceries').querySelector('.what') as HTMLElement).click();
		await settle(card);
		const select = root.querySelector('.scrim select') as HTMLSelectElement;
		// happy-dom gets an option's selectedness wrong; browsers follow the attribute.
		expect([...select.options].map((o) => [o.textContent!.trim(), o.hasAttribute('selected')])).toEqual([
			['Inbox', false],
			['Chores', false],
			['Flying', false],
			['Household', true],
		]);
		select.value = 'chores';
		select.dispatchEvent(new Event('change'));
		await settle(card);
		root.querySelector('.scrim form')!.dispatchEvent(new Event('submit', { cancelable: true }));
		await settle(card);
		expect(writes(hass)).toEqual([{ type: 'pecklist/task/update', entry_id: 'ben', task_id: 'h3', changes: { listId: 'chores' } }]);
		const chores = [...root.querySelectorAll('.groups section')].filter((g) => g.querySelector('h3')!.textContent!.trim() === 'Chores');
		expect(chores.flatMap((g) => text(g, '.name'))).toEqual(['Groceries', 'Coffee beans', 'Milk']);
		// A subtask moves with its parent, not on its own.
		(row(root, 'Milk').querySelector('.what') as HTMLElement).click();
		await settle(card);
		expect(root.querySelector('.scrim')).not.toBeNull();
		expect(root.querySelector('.scrim select')).toBeNull();
		expect(root.querySelector('.scrim .subs')).toBeNull();
	});

	it('subtasks: check off, rename, delete and add them without leaving the dialog', async () => {
		const { card, root, hass } = await mount({ view: 'list', lists: ['household'] });
		(row(root, 'Groceries').querySelector('.what') as HTMLElement).click();
		await settle(card);
		const titles = () => ([...root.querySelectorAll('.subs input')] as HTMLInputElement[]).map((i) => [i.value, i.classList.contains('closed')]);
		const subtask = (title: string) => [...root.querySelectorAll('.subs li')].find((li) => (li.querySelector('input') as HTMLInputElement).value === title)!;
		expect(titles()).toEqual([
			['Milk', false],
			['Coffee beans', false],
		]);
		(subtask('Milk').querySelector('.check') as HTMLElement).click();
		await settle(card);
		expect(titles()).toEqual([
			['Coffee beans', false],
			['Milk', true],
		]);
		const rename = subtask('Coffee beans').querySelector('input') as HTMLInputElement;
		rename.value = 'Decaf beans';
		rename.dispatchEvent(new Event('change'));
		await settle(card);
		(subtask('Milk').querySelector('.remove') as HTMLElement).click();
		await settle(card);
		expect(text(root, '.scrim .note')).toEqual(['Milk moved to the trash.']);
		const add = root.querySelector('.sub-add') as HTMLInputElement;
		add.value = 'Bread';
		const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
		add.dispatchEvent(enter);
		await settle(card);
		expect(enter.defaultPrevented).toBe(true);
		expect(add.value).toBe('');
		expect(root.querySelector('.scrim')).not.toBeNull();
		expect(titles()).toEqual([
			['Decaf beans', false],
			['Bread', false],
		]);
		expect(writes(hass)).toEqual([
			{ type: 'pecklist/task/complete', entry_id: 'ben', task_id: 'h3a' },
			{ type: 'pecklist/task/update', entry_id: 'ben', task_id: 'h3b', changes: { title: 'Decaf beans' } },
			{ type: 'pecklist/task/delete', entry_id: 'ben', task_id: 'h3a' },
			{ type: 'pecklist/task/create', entry_id: 'ben', task: { title: 'Bread', parentId: 'h3', listId: 'household' } },
		]);
		// Nothing about the task itself changed: Save just closes.
		root.querySelector('.scrim form')!.dispatchEvent(new Event('submit', { cancelable: true }));
		await settle(card);
		expect(writes(hass)).toHaveLength(4);
		expect(root.querySelector('.scrim')).toBeNull();
	});

	it('calendar: drag a task to another day to move it there, at the same time', async () => {
		const { card, root, hass } = await mount({ view: 'calendar' });
		expect(card.getGridOptions().rows).toBe(8);
		expect(root.querySelectorAll('.cday').length % 7).toBe(0);
		expect(root.querySelectorAll('.cday').length).toBeGreaterThanOrEqual(28);
		const today = root.querySelector('.cday.today') as HTMLElement;
		expect(today.dataset.day).toBe(TODAY);
		expect(text(today, '.ctask')).toEqual(['Take out the bins', 'Empty the dishwasher']);
		const target = besideToday(root);
		const day = target.dataset.day!;
		const chip = chipOf(root, 'Empty the dishwasher');
		over(root, () => target);
		pointer('pointerdown', chip, 10, 10);
		pointer('pointermove', chip, 12, 11);
		await settle(card);
		// Not yet: a mouse has to move a little before a press is a drag.
		expect(chip.classList.contains('lifted')).toBe(false);
		pointer('pointermove', chip, 60, 10);
		await settle(card);
		expect(chip.classList.contains('lifted')).toBe(true);
		expect(target.classList.contains('drop')).toBe(true);
		pointer('pointerup', chip, 60, 10);
		chip.click();
		await settle(card);
		// The click after a drag does not open the task.
		expect(root.querySelector('.scrim')).toBeNull();
		expect(writes(hass)).toEqual([
			{ type: 'pecklist/task/update', entry_id: 'ben', task_id: 'b1', changes: { schedule: { start: `${day}T18:00`, end: null, allDay: false } } },
		]);
		const moved = root.querySelector(`.cday[data-day="${day}"]`)!;
		expect(text(moved, '.ctask')).toContain('Empty the dishwasher');
		expect(text(root.querySelector('.cday.today')!, '.ctask')).toEqual(['Take out the bins']);
		expect(root.querySelector('.drop, .lifted')).toBeNull();
	});

	it('calendar: a tap opens the task, a drop on its own day changes nothing, and a read-only task stays put', async () => {
		const hass = household(TODAY);
		hass.people[0]!.lists.find((l) => l.id === 'household')!.role = 'viewer';
		const { card, root } = await mount({ view: 'calendar' }, hass);
		const today = root.querySelector('.cday.today') as HTMLElement;
		over(root, () => today);
		const dishwasher = chipOf(root, 'Empty the dishwasher');
		pointer('pointerdown', dishwasher, 10, 10);
		pointer('pointermove', dishwasher, 40, 30);
		pointer('pointerup', dishwasher, 40, 30);
		dishwasher.click();
		await settle(card);
		expect(writes(hass)).toEqual([]);
		expect(root.querySelector('.scrim')).toBeNull();
		pointer('pointerdown', dishwasher, 10, 10);
		pointer('pointerup', dishwasher, 10, 10);
		dishwasher.click();
		await settle(card);
		expect((root.querySelector('.scrim input') as HTMLInputElement).value).toBe('Empty the dishwasher');
		(root.querySelector('.scrim .btn:not(.danger):not(.primary)') as HTMLElement).click();
		await settle(card);
		const target = besideToday(root);
		over(root, () => target);
		const bins = chipOf(root, 'Take out the bins');
		pointer('pointerdown', bins, 10, 10);
		pointer('pointermove', bins, 60, 10);
		await settle(card);
		expect(bins.classList.contains('lifted')).toBe(false);
		pointer('pointerup', bins, 60, 10);
		bins.click();
		await settle(card);
		expect(writes(hass)).toEqual([]);
		// A task you may only view: a tap shows its day instead.
		expect(root.querySelector('.scrim')).toBeNull();
		expect(root.querySelector('.cday.today')!.getAttribute('aria-current')).toBe('date');
	});

	it('calendar: a finger holds a task to lift it; moving sooner scrolls', async () => {
		const { card, root, hass } = await mount({ view: 'calendar' });
		const target = besideToday(root);
		over(root, () => target);
		const chip = chipOf(root, 'Empty the dishwasher');
		pointer('pointerdown', chip, 10, 10, 'touch');
		pointer('pointermove', chip, 10, 40, 'touch');
		await new Promise((resolve) => setTimeout(resolve, 400));
		await settle(card);
		expect(chip.classList.contains('lifted')).toBe(false);
		pointer('pointerup', chip, 10, 40, 'touch');
		expect(writes(hass)).toEqual([]);

		pointer('pointerdown', chip, 10, 10, 'touch');
		await new Promise((resolve) => setTimeout(resolve, 400));
		await settle(card);
		expect(chip.classList.contains('lifted')).toBe(true);
		const scroll = new Event('touchmove', { cancelable: true });
		chip.dispatchEvent(scroll);
		expect(scroll.defaultPrevented).toBe(true);
		pointer('pointermove', chip, 60, 10, 'touch');
		pointer('pointerup', chip, 60, 10, 'touch');
		await settle(card);
		expect(writes(hass).map((w) => w.task_id)).toEqual(['b1']);
	});

	it('calendar: a week of days, a week at a time, with times', async () => {
		const { card, root, hass } = await mount({ view: 'calendar', range: 'week' });
		const days = () => ([...root.querySelectorAll('.cday')] as HTMLElement[]).map((c) => c.dataset.day!);
		expect(days()).toHaveLength(7);
		expect(days()).toContain(TODAY);
		expect(root.querySelector('.cday.out')).toBeNull();
		expect(text(chipOf(root, 'Empty the dishwasher'), 'b')).toEqual(['6:00 PM']);
		// From the keyboard: Alt and an arrow move it a day, toward a day in this week, and it keeps the focus.
		const right = days().indexOf(TODAY) < 6;
		const dish = chipOf(root, 'Empty the dishwasher');
		dish.focus();
		dish.dispatchEvent(new KeyboardEvent('keydown', { key: right ? 'ArrowRight' : 'ArrowLeft', altKey: true, bubbles: true, cancelable: true }));
		await settle(card);
		const next = addDays(TODAY, right ? 1 : -1);
		expect((writes(hass)[0] as { changes: unknown }).changes).toEqual({ schedule: { start: `${next}T18:00`, end: null, allDay: false } });
		const focused = root.activeElement as HTMLElement;
		expect(focused.textContent).toContain('Empty the dishwasher');
		expect(focused.closest('.cday')!.getAttribute('data-day')).toBe(next);
		const first = days()[0]!;
		(root.querySelector('.nav [aria-label="Later"]') as HTMLElement).click();
		await settle(card);
		expect(days()[0]).toBe(addDays(first, 7));
		const [month] = [...root.querySelectorAll('.seg button')] as HTMLElement[];
		month!.click();
		await settle(card);
		expect(days().length).toBeGreaterThanOrEqual(28);
		expect(month!.getAttribute('aria-pressed')).toBe('true');
	});

	it('a move or a subtask edit on its way does not show as checked off (Dev 1)', async () => {
		const hass = household(TODAY);
		// Writes that never answer: what the card shows while they are on their way.
		const answer = hass.callWS.bind(hass);
		hass.callWS = (<T,>(message: Record<string, unknown>): Promise<T> => {
			if (message.type === 'pecklist/task/update' || message.type === 'pecklist/task/delete') {
				hass.calls.push(message);
				return new Promise<T>(() => {});
			}
			return answer<T>(message);
		}) as typeof hass.callWS;
		const { card, root } = await mount({ view: 'calendar' }, hass);
		const target = besideToday(root);
		over(root, () => target);
		const chip = chipOf(root, 'Empty the dishwasher');
		pointer('pointerdown', chip, 10, 10);
		pointer('pointermove', chip, 60, 10);
		pointer('pointerup', chip, 60, 10);
		await settle(card);
		expect(writes(hass)).toHaveLength(1);
		target.click();
		await settle(card);
		expect(text(target, '.ctask')).toContain('Empty the dishwasher');
		expect(row(root, 'Empty the dishwasher').querySelector('.check')!.getAttribute('aria-checked')).toBe('false');

		document.body.replaceChildren();
		const list = await mount({ view: 'list', lists: ['household'] }, hass);
		(row(list.root, 'Groceries').querySelector('.what') as HTMLElement).click();
		await settle(list.card);
		const subtask = (title: string) => [...list.root.querySelectorAll('.subs li')].find((li) => (li.querySelector('input') as HTMLInputElement).value === title)!;
		const rename = subtask('Milk').querySelector('input') as HTMLInputElement;
		rename.value = 'Oat milk';
		rename.dispatchEvent(new Event('change'));
		(subtask('Coffee beans').querySelector('.remove') as HTMLElement).click();
		await settle(list.card);
		expect([...list.root.querySelectorAll('.subs .check')].map((c) => c.getAttribute('aria-checked'))).toEqual(['false', 'false']);
	});

	it('a drag ends even when its task is drawn away mid-drag, and the next one works (Dev 1)', async () => {
		const { card, root, hass } = await mount({ view: 'calendar' });
		const target = besideToday(root);
		over(root, () => target);
		pointer('pointerdown', chipOf(root, 'Empty the dishwasher'), 10, 10);
		pointer('pointermove', chipOf(root, 'Empty the dishwasher'), 60, 10);
		await settle(card);
		// Another device moves it meanwhile: the chip under the pointer goes away.
		const ben = hass.people[0]!;
		ben.tasks.find((t) => t.id === 'b1')!.schedule = { start: `${addDays(TODAY, 40)}T18:00`, end: null, allDay: false };
		hass.push();
		await settle(card);
		expect(chipOf(root, 'Empty the dishwasher')).toBeUndefined();
		// The release still lands where the hand let go, and the drag is over.
		pointer('pointerup', document.body, 60, 10);
		await settle(card);
		expect(root.querySelector('.drop, .lifted')).toBeNull();
		expect(writes(hass).map((w) => w.task_id)).toEqual(['b1']);
		const bins = chipOf(root, 'Take out the bins');
		pointer('pointerdown', bins, 10, 10);
		pointer('pointermove', bins, 60, 10);
		await settle(card);
		expect(bins.classList.contains('lifted')).toBe(true);
		pointer('pointerup', bins, 60, 10);
		await settle(card);
		expect(writes(hass).map((w) => w.task_id)).toEqual(['b1', 'h1']);
	});

	it('Alt and an arrow into a busy day keep the focus on the moved task (QA)', async () => {
		const hass = household(TODAY);
		// Mow sorts before Logbook while it is still moving (its old day is earlier), and after it once
		// the server has it on Logbook's day (by title): the day's order changes under the focus.
		const day = `${TODAY.slice(0, 7)}-15`;
		const ben = hass.people[0]!;
		ben.tasks.find((t) => t.id === 'b2')!.schedule = { start: day, end: null, allDay: true };
		ben.tasks.find((t) => t.id === 'b12')!.schedule = { start: addDays(day, 1), end: null, allDay: true };
		const { card, root } = await mount({ view: 'calendar' }, hass);
		const mow = chipOf(root, 'Mow the lawn');
		mow.focus();
		const alt = (key: string) =>
			(root.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key, altKey: true, bubbles: true, cancelable: true }));
		alt('ArrowRight');
		await settle(card);
		const next = root.querySelector(`.cday[data-day="${addDays(day, 1)}"]`)!;
		const order = text(next, '.ctask');
		expect(order.indexOf('Logbook entries')).toBeGreaterThanOrEqual(0);
		expect(order.indexOf('Logbook entries')).toBeLessThan(order.indexOf('Mow the lawn'));
		expect((root.activeElement as HTMLElement).textContent).toContain('Mow the lawn');
		alt('ArrowRight');
		await settle(card);
		expect(writes(hass).map((w) => w.task_id)).toEqual(['b2', 'b2']);

		// Opening the task straight after a move: the dialog keeps the focus (Dev 1).
		alt('ArrowRight');
		(root.activeElement as HTMLElement).click();
		await card.updateComplete;
		const title = root.querySelector('.scrim input') as HTMLInputElement;
		title.focus();
		await settle(card);
		expect(root.activeElement).toBe(title);
		(root.querySelector('.scrim .btn:not(.danger):not(.primary)') as HTMLElement).click();
		await settle(card);

		// Or tabbing out of the card: the focus stays where it went.
		chipOf(root, 'Mow the lawn').focus();
		alt('ArrowLeft');
		const outside = document.createElement('button');
		document.body.append(outside);
		outside.focus();
		await settle(card);
		expect(document.activeElement).toBe(outside);
	});

	it('a dialog opened from the keyboard takes the focus, keeps Tab inside, and gives it back (Manager)', async () => {
		const { card, root } = await mount({ view: 'list', lists: ['chores'] });
		const what = row(root, 'Mow the lawn').querySelector('.what') as HTMLElement;
		what.focus();
		what.click();
		await settle(card);
		const form = root.querySelector('.scrim form') as HTMLElement;
		expect(root.activeElement).toBe(form);
		// Tab from the last control goes round to the first; Shift+Tab from the dialog to the last.
		const tab = (from: HTMLElement, shiftKey = false) => {
			const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
			from.dispatchEvent(event);
			return event.defaultPrevented;
		};
		const save = form.querySelector('.btn.primary') as HTMLElement;
		const title = form.querySelector('input') as HTMLElement;
		form.focus();
		expect(tab(form, true)).toBe(true);
		expect(root.activeElement).toBe(save);
		expect(tab(save)).toBe(true);
		expect(root.activeElement).toBe(title);
		expect(tab(title)).toBe(false);
		// Escape closes it, and the focus is back on the row that opened it.
		title.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		await settle(card);
		expect(root.querySelector('.scrim')).toBeNull();
		expect((root.activeElement as HTMLElement).dataset.task).toBe('b2');
		expect(root.activeElement!.classList.contains('what')).toBe(true);
	});

	it('after a save moves the task, the focus follows it to its new day (Manager)', async () => {
		const { card, root, hass } = await mount({ view: 'calendar' });
		const target = besideToday(root);
		const chip = chipOf(root, 'Empty the dishwasher');
		chip.focus();
		chip.click();
		await settle(card);
		expect(root.activeElement).toBe(root.querySelector('.scrim form'));
		const date = root.querySelector('.scrim input[type="date"]') as HTMLInputElement;
		date.value = target.dataset.day!;
		date.dispatchEvent(new Event('input'));
		await settle(card);
		root.querySelector('.scrim form')!.dispatchEvent(new Event('submit', { cancelable: true }));
		await settle(card);
		expect(writes(hass).map((w) => w.task_id)).toEqual(['b1']);
		const focused = root.activeElement as HTMLElement;
		expect(focused.classList.contains('ctask')).toBe(true);
		expect(focused.dataset.task).toBe('b1');
		expect(focused.closest('.cday')!.getAttribute('data-day')).toBe(target.dataset.day);
	});

	it('a dialog opened by a tap that gave no focus leaves the focus alone on close', async () => {
		const { card, root } = await mount({ view: 'list', lists: ['chores'] });
		(row(root, 'Mow the lawn').querySelector('.what') as HTMLElement).click();
		await settle(card);
		(root.querySelector('.scrim .btn:not(.danger):not(.primary)') as HTMLElement).click();
		await settle(card);
		expect(root.querySelector('.scrim')).toBeNull();
		expect(root.activeElement).toBeNull();
	});

	it('shopping list: what Clear is taking away stays ticked while it goes (Manager)', async () => {
		const hass = household(TODAY);
		// Deletes that never answer: what the card shows while they are on their way.
		const answer = hass.callWS.bind(hass);
		hass.callWS = (<T,>(message: Record<string, unknown>): Promise<T> => {
			if (message.type === 'pecklist/task/delete') {
				hass.calls.push(message);
				return new Promise<T>(() => {});
			}
			return answer<T>(message);
		}) as typeof hass.callWS;
		const { card, root } = await mount({ view: 'shopping', lists: ['chores'] }, hass);
		(root.querySelector('.clear') as HTMLElement).click();
		await settle(card);
		expect(writes(hass)).toEqual([{ type: 'pecklist/task/delete', entry_id: 'ben', task_id: 'b8' }]);
		const plants = row(root, 'Water the plants');
		expect(plants.classList.contains('leaving')).toBe(true);
		const check = plants.querySelector('.check') as HTMLButtonElement;
		expect([check.getAttribute('aria-checked'), check.disabled]).toEqual(['true', true]);
		// Other rows carry on as usual.
		expect(row(root, 'Rake leaves').classList.contains('leaving')).toBe(false);
		// Nothing is left to clear meanwhile, so the button goes; ticking one more offers just that one.
		expect(root.querySelector('.clear')).toBeNull();
		(row(root, 'Rake leaves').querySelector('.check') as HTMLElement).click();
		await settle(card);
		expect(text(root, '.clear')).toEqual(['Clear 1']);
	});

	it('after closing, moving on to another row keeps the focus there through the redraw (Dev 1)', async () => {
		const { card, root, hass } = await mount({ view: 'list', lists: ['chores'] });
		const what = (title: string) => row(root, title).querySelector('.what') as HTMLElement;
		what('Mow the lawn').focus();
		what('Mow the lawn').click();
		await settle(card);
		root.querySelector('.scrim form')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		await settle(card);
		expect((root.activeElement as HTMLElement).dataset.task).toBe('b2');
		// Within the hold, the person moves on; then a snapshot redraws the card.
		what('Rake leaves').focus();
		hass.push();
		await settle(card);
		expect((root.activeElement as HTMLElement).dataset.task).toBe('b10');
	});

	it('when the list re-sorts under a restored focus, the focus follows the task, not the row it was in', async () => {
		const { card, root, hass } = await mount({ view: 'list', lists: ['chores'] });
		const what = (title: string) => row(root, title).querySelector('.what') as HTMLElement;
		what('Mow the lawn').focus();
		what('Mow the lawn').click();
		await settle(card);
		root.querySelector('.scrim form')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		await settle(card);
		const restored = root.activeElement as HTMLElement;
		expect(restored.dataset.task).toBe('b2');
		// Then the server's answer (or another device) re-sorts the list: lit draws another task into
		// the focused row, and the focus goes on to the task's own row.
		hass.people[0]!.tasks.find((t) => t.id === 'b2')!.schedule = { start: addDays(TODAY, 300), end: null, allDay: true };
		hass.push();
		await settle(card);
		const focused = root.activeElement as HTMLElement;
		expect(focused.dataset.task).toBe('b2');
		expect(focused.textContent).toContain('Mow the lawn');
	});
});
