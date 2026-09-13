'use client';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { ChevronRight, Download, SlidersHorizontal, Eye, Monitor, Smartphone, RotateCcw, Info, LockKeyhole, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Shell } from './shell';
import { usePreferences } from './preferences';
import { LEVELS, HCE_CORPUS, getTarget, getSearchWords, phonemeLabel, type PhonemeWord, type ActivityConfig, type ActivityType, type Difficulty } from '@/lib/studio/data';
import { downloadActivity, generateHtml } from '@/lib/studio/export';
export function Field({ id, label, children, help }: {
    id: string;
    label: string;
    children: ReactNode;
    help?: string;
}) { return <div className="field"><label htmlFor={id}>{label}</label>{children}{help && <p className="field-help" id={id + '-help'}>{help}</p>}</div>; }
export function Toggle({ id, label, help, checked, onChange }: {
    id: string;
    label: string;
    help: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) { return <div className="toggle-row"><div><label htmlFor={id}>{label}</label><p id={id + '-help'}>{help}</p></div><Switch id={id} className="studio-switch" checked={checked} onCheckedChange={onChange} aria-describedby={id + '-help'}/></div>; }
function SoundWord({word}: {word: PhonemeWord}) {
    return <div className="target-word">
        <div>
            <div className="ipa" aria-label={`Target word: ${word.english}, ${word.phonemes.length} phonemes`}>
                <span>/</span>{word.phonemes.map((sound, index) =>
                    <Tooltip key={index}>
                        <TooltipTrigger asChild><span tabIndex={0}>{sound}</span></TooltipTrigger>
                        <TooltipContent>{phonemeLabel(sound)}</TooltipContent>
                    </Tooltip>)}<span>/</span>
            </div>
            <small>{word.english.toUpperCase()} · {word.phonemes.length} phonemes</small>
        </div>
        <LockKeyhole size={15} className="muted"/>
    </div>;
}
function GridDimension({id, label, value, onChange}: {id: string; label: string; value: number; onChange: (value: number) => void}) {
    return <Field id={id} label={label}>
        <input key={value} id={id} className="text-input" type="number" min={6} max={16} step={1}
            defaultValue={value} aria-describedby="grid-size-help"
            onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}
            onBlur={event => {
                const next = Number(event.currentTarget.value);
                if (Number.isInteger(next) && next >= 6 && next <= 16) onChange(next);
                else {
                    event.currentTarget.value = String(value);
                    toast.error('Use a whole number between 6 and 16.');
                }
            }}/>
    </Field>;
}
function ConfigPanel({config, change, onGenerate}: {
    config: ActivityConfig;
    change: (value: Partial<ActivityConfig>) => void;
    onGenerate: () => void;
}) {
    const wordle = config.type === 'wordle';
    const target = getTarget(config.wordId);
    const words = getSearchWords(config.wordSet);
    function setDifficulty(value: Difficulty) {
        const level = LEVELS[value];
        change(wordle ? {difficulty: value} : {difficulty: value, rows: level.size, cols: level.size});
    }
    return <section className="config-panel" aria-label="Activity configuration">
        <div className="panel-heading"><SlidersHorizontal size={16}/>Activity settings</div>
        <div className="config-body">
            <div className="form-section">
                <p className="section-title">1 · The basics</p>
                <Field id="activity-title" label="Activity title">
                    <input id="activity-title" className={'text-input' + (!config.title.trim() ? ' invalid' : '')}
                        value={config.title} onChange={event => change({title: event.target.value})} maxLength={70}
                        aria-invalid={!config.title.trim()} aria-describedby={!config.title.trim() ? 'title-error' : undefined}/>
                    {!config.title.trim() && <span id="title-error" className="error-text">Add a title before generating your activity.</span>}
                </Field>
                <Field id="instructions" label="Student instructions">
                    <textarea id="instructions" className="text-input" value={config.instructions}
                        onChange={event => change({instructions: event.target.value})} maxLength={350}/>
                </Field>
                <Field id="difficulty" label="Difficulty" help={wordle
                    ? `${LEVELS[config.difficulty].attempts} guesses to find the ${target.phonemes.length}-sound word.`
                    : `${config.rows} × ${config.cols} grid. ${LEVELS[config.difficulty].description}.`}>
                    <Select value={config.difficulty} onValueChange={value => setDifficulty(value as Difficulty)}>
                        <SelectTrigger id="difficulty" className="select-control" aria-describedby="difficulty-help"><SelectValue/></SelectTrigger>
                        <SelectContent>{Object.entries(LEVELS).map(([key, level]) =>
                            <SelectItem key={key} value={key}>{level.label} · {wordle ? `${level.attempts} guesses` : level.description}</SelectItem>
                        )}</SelectContent>
                    </Select>
                </Field>
                {!wordle && <>
                    <div className="grid-dimensions">
                        <GridDimension id="grid-rows" label="Rows" value={config.rows} onChange={rows => change({rows})}/>
                        <GridDimension id="grid-cols" label="Columns" value={config.cols} onChange={cols => change({cols})}/>
                    </div>
                    <p className="field-help" id="grid-size-help">Use 6–16 rows and columns. Changing difficulty restores its suggested grid size.</p>
                </>}
            </div>
            <div className="form-section">
                <p className="section-title">2 · Sounds & support</p>
                {wordle ? <>
                    <Field id="focus-word" label="Focus word" help="Choose one answer from the supplied 90-word HCE corpus.">
                        <Select value={config.wordId} onValueChange={wordId => change({wordId})}>
                            <SelectTrigger id="focus-word" className="select-control" aria-describedby="focus-word-help"><SelectValue/></SelectTrigger>
                            <SelectContent>{[3,4,5].map(length => <SelectGroup key={length}>
                                <SelectLabel>{length} phonemes · 30 words</SelectLabel>
                                {HCE_CORPUS.filter(word => word.phonemes.length === length).map(word =>
                                    <SelectItem key={word.english} value={word.english}>{word.english} · /{word.phonemes.join('')}/</SelectItem>
                                )}
                            </SelectGroup>)}</SelectContent>
                        </Select>
                    </Field>
                    <SoundWord word={target}/>
                    <p className="field-help" style={{marginTop: 8}}>The student sees this answer when the round ends.</p>
                </> : <>
                    <Field id="word-set" label="Word set" help="Examples from your supplied Phoneme Word Search file.">
                        <Select value={config.wordSet} onValueChange={value => change({wordSet: value as 'starter' | 'full'})}>
                            <SelectTrigger id="word-set" className="select-control" aria-describedby="word-set-help"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="starter">Assessment 1 · 5 words</SelectItem>
                                <SelectItem value="full">All supplied examples · 10 words</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <ul className="fixed-word-list" aria-label="Supplied phoneme word list">
                        {words.map(word => <li key={word.english}><span className="ipa">/{word.phonemes.join(' ')}/</span><span className="muted">{word.english}</span></li>)}
                    </ul>
                    <Button variant="outline" className="w-full mt-3" onClick={() => change({seed: config.seed + 1})}><Shuffle size={14}/>New arrangement</Button>
                </>}
                <Toggle id="phoneme-hints" label="Phoneme hints" help="Sound examples on hover and focus." checked={config.hints} onChange={hints => change({hints})}/>
                <Toggle id="english-labels" label={wordle ? 'Keyboard letter labels' : 'English word labels'}
                    help={wordle ? 'Show a familiar letter cue below each sound.' : 'Show English words beside the phonemes.'}
                    checked={config.labels} onChange={labels => change({labels})}/>
                <div className="small-info"><Info size={15}/><span>Broad HCE transcription. Each phoneme stays in one tile, including /tʃ/, /æɪ/ and /ʉː/.</span></div>
            </div>
            <div className="download-zone">
                <Button className="primary-button" onClick={onGenerate} disabled={!config.title.trim()}><Download size={16}/>Generate HTML</Button>
                <p>One file. Playable offline in your browser.</p>
            </div>
        </div>
    </section>;
}
function IconAction({ label, children, onClick, pressed }: {
    label: string;
    children: ReactNode;
    onClick: () => void;
    pressed?: boolean;
}) { return <Tooltip><TooltipTrigger asChild><button className="icon-button" aria-label={label} aria-pressed={pressed} onClick={onClick}>{children}</button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>; }
function LivePreview({ config }: {
    config: ActivityConfig;
}) { const [size, setSize] = useState<'desktop' | 'mobile'>('desktop'); const [restart, setRestart] = useState(0); const html = useMemo(() => generateHtml(config), [config]); return <section className="preview-panel" aria-label="Live student preview"><div className="preview-toolbar"><div className="preview-title"><Eye size={16}/>Student preview<span className="tag">Interactive</span></div><div className="preview-actions"><IconAction label="Desktop preview" pressed={size === 'desktop'} onClick={() => setSize('desktop')}><Monitor size={16}/></IconAction><IconAction label="Phone preview" pressed={size === 'mobile'} onClick={() => setSize('mobile')}><Smartphone size={16}/></IconAction><IconAction label="Restart preview" onClick={() => setRestart(v => v + 1)}><RotateCcw size={15}/></IconAction></div></div><div className={'preview-stage ' + size}><iframe key={restart} srcDoc={html} title={config.type === 'wordle' ? 'Playable phoneme Wordle preview' : 'Playable phoneme Word Search preview'} sandbox="allow-scripts" style={{ minHeight: config.type === 'wordle' ? (LEVELS[config.difficulty].attempts * 53 + 550) : 830 }}/></div><div className="preview-caption">Try it exactly as your students will. Changing settings restarts the preview.</div></section>; }
/** Optional WebMCP uses the same configuration and export actions as the visible controls. */
function useBuilderTools(config: ActivityConfig, change: (p: Partial<ActivityConfig>) => void) {
    const current = useRef({ config, change });
    current.current = { config, change };
    useEffect(() => {
        type Context = {
            registerTool: (tool: Record<string, unknown>, options: {
                signal: AbortSignal;
            }) => void | Promise<void>;
        };
        const context = (document as Document & {
            modelContext?: Context;
        }).modelContext;
        if (!context?.registerTool)
            return;
        const lifecycle = new AbortController();
        const register = (tool: Record<string, unknown>) => { try {
            Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => { });
        }
        catch { /* Unsupported implementations do not affect the interface. */ } };
        register({ name: 'configure_phoneme_activity', description: 'Update the visible activity title, difficulty, and phoneme support. This does not download the activity.', inputSchema: { type: 'object', properties: { title: { type: 'string', minLength: 1, maxLength: 70 }, difficulty: { enum: ['gentle', 'standard', 'challenge'] }, hints: { type: 'boolean' }, labels: { type: 'boolean' }, wordId: {type: 'string', enum: HCE_CORPUS.map(word => word.english)}, wordSet: {enum: ['starter', 'full']}, rows: {type: 'integer', minimum: 6, maximum: 16}, cols: {type: 'integer', minimum: 6, maximum: 16} }, additionalProperties: false }, annotations: { readOnlyHint: false }, execute: (input: unknown) => { if (!input || typeof input !== 'object' || Array.isArray(input))
                throw new Error('Expected configuration object.'); const value = input as Record<string, unknown>; if (Object.keys(value).some(k => !['title', 'difficulty', 'hints', 'labels', 'wordId', 'wordSet', 'rows', 'cols'].includes(k)))
                throw new Error('Unknown setting.'); if ('title' in value && (typeof value.title !== 'string' || !value.title.trim() || value.title.length > 70))
                throw new Error('Title must contain 1–70 characters.'); if ('difficulty' in value && !['gentle', 'standard', 'challenge'].includes(String(value.difficulty)))
                throw new Error('Unsupported difficulty.'); if ('wordId' in value && !HCE_CORPUS.some(word => word.english === value.wordId)) throw new Error('Choose a supplied HCE word.'); if ('wordSet' in value && !['starter','full'].includes(String(value.wordSet))) throw new Error('Unsupported word set.'); for (const dimension of ['rows','cols']) if (dimension in value && (typeof value[dimension] !== 'number' || !Number.isInteger(value[dimension]) || Number(value[dimension]) < 6 || Number(value[dimension]) > 16)) throw new Error('Grid dimensions must be integers from 6 to 16.'); for (const k of ['hints', 'labels'])
                if (k in value && typeof value[k] !== 'boolean')
                    throw new Error(k + ' must be boolean.'); flushSync(() => current.current.change(value as Partial<ActivityConfig>)); return { configuration: current.current.config }; } });
        register({ name: 'download_phoneme_activity', description: 'Download the current playable activity as a single standalone HTML file.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false }, execute: (input: unknown) => { if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length)
                throw new Error('Expected an empty object.'); if (!current.current.config.title.trim())
                throw new Error('Add an activity title first.'); downloadActivity(current.current.config); return { status: 'download_requested', activity: current.current.config.type }; } });
        return () => lifecycle.abort();
    }, []);
}
export function BuilderPage({ type }: {
    type: ActivityType;
}) {
    const { preferences, activities, updateActivity } = usePreferences();
    const draft = activities[type];
    const config = useMemo(() => ({ ...draft, theme: preferences.theme }), [draft, preferences.theme]);
    const name = type === 'wordle' ? 'Wordle' : 'Word Search';
    function change(value: Partial<ActivityConfig>) {
        if (type === 'word-search' && value.difficulty) {
            const level = LEVELS[value.difficulty];
            updateActivity(type, {rows: level.size, cols: level.size, ...value});
        } else updateActivity(type, value);
    }
    useBuilderTools(config, change);
    function generate() { if (!config.title.trim())
        return; try {
        downloadActivity(config);
        toast.success('Your activity is ready', { description: 'Open the downloaded HTML file in your browser to play.' });
    }
    catch {
        toast.error('The activity could not be generated. Please try again.');
    } }
    return <Shell page={type}><nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={13}/><span aria-current="page">{name} builder</span></nav><div className="page-heading builder-heading"><div><p className="eyebrow">A LITTLE PLAY. A LOT OF LEARNING.</p><h1>Create a phoneme {name}</h1><p>Make it yours on the left. Give it a go on the right.</p></div><Button className="primary-button" onClick={generate} disabled={!config.title.trim()}><Download size={16}/>Generate HTML</Button></div><div className="builder-layout"><ConfigPanel config={config} change={change} onGenerate={generate}/><LivePreview config={config}/></div></Shell>;
}
