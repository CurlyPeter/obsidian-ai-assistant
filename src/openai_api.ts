import { MarkdownRenderer, MarkdownView, Notice } from "obsidian";

import { OpenAI } from "openai";
import { request } from "obsidian";

export class OpenAIAssistant {
	modelName: string;
	apiFun: any;
	maxTokens: number;
	apiKey: string;

	constructor(apiKey: string, modelName: string, maxTokens: number) {
		this.apiFun = new OpenAI({
			apiKey: apiKey,
			dangerouslyAllowBrowser: true,
		});
		this.modelName = modelName;
		this.maxTokens = maxTokens;
		this.apiKey = apiKey;
	}

	display_error = (err: any) => {
		if (err instanceof OpenAI.APIError) {
			console.error("OpenAI API Error Details:", {
				status: err.status,
				message: err.message,
				type: err.type,
				code: err.code,
				param: err.param,
				error: err.error,
				headers: err.headers,
				request_id: err.request_id
			});
			new Notice(`## OpenAI API Error (${err.status}): ${err.message}. Check console for full details.`);
		} else {
			console.error("OpenAI Error:", err);
			new Notice(`Error: ${err}`);
		}
	};

	text_api_call = async (
		prompt_list: { [key: string]: string }[],
		htmlEl?: HTMLElement,
		view?: MarkdownView,
		temperature: number = 0.5
	) => {
		const streamMode = htmlEl !== undefined;
		const has_img = prompt_list.some((el) => Array.isArray(el.content));
		let model = this.modelName;
		console.log (prompt_list);
		console.log ("temperature: " + temperature);

		// GPT-5 models only support temperature = 1
		if (this.modelName.startsWith("gpt-5")) {
			temperature = 1;
			console.log ("GPT-5 model detected, forcing temperature to 1");
		}

		if (has_img) {
			// Use GPT-5 for vision tasks if available, otherwise fallback to gpt-4-vision-preview
			if (this.modelName.startsWith("gpt-5")) {
				model = this.modelName; // GPT-5 has native multimodal support
			} else {
				model = "gpt-4-vision-preview";
			}
		}
		try {
			const apiParams: any = {
				messages: prompt_list,
				model: model,
				stream: streamMode,
				temperature: temperature,
			};

			// GPT-5 models use max_completion_tokens instead of max_tokens
			if (this.modelName.startsWith("gpt-5")) {
				apiParams.max_completion_tokens = this.maxTokens;
			} else {
				apiParams.max_tokens = this.maxTokens;
			}

			console.log("OpenAI API Request Parameters:", {
				model: apiParams.model,
				max_tokens: apiParams.max_tokens,
				max_completion_tokens: apiParams.max_completion_tokens,
				stream: apiParams.stream,
				temperature: apiParams.temperature,
				messages_count: apiParams.messages.length,
				first_message_role: apiParams.messages[0]?.role,
				has_images: has_img
			});

			const response = await this.apiFun.chat.completions.create(apiParams);

			if (streamMode) {
				let responseText = "";
				for await (const chunk of response) {
					const content = chunk.choices[0].delta.content;
					if (content) {
						responseText = responseText.concat(content);
						htmlEl.innerHTML = "";
						if (view) {
							await MarkdownRenderer.renderMarkdown(
								responseText,
								htmlEl,
								"",
								view,
							);
						} else {
							htmlEl.innerHTML += responseText;
						}
					}
				}
				return htmlEl.innerHTML;
			} else {
				return response.choices[0].message.content;
			}
		} catch (err) {
			this.display_error(err);
		}
	};

	img_api_call = async (
		model: string,
		prompt: string,
		img_size: string,
		num_img: number,
		is_hd: boolean,
	) => {
		try {
			const params: { [key: string]: string | number } = {};
			params.model = model;
			params.prompt = prompt;
			params.n = num_img;
			params.size = img_size;

			if (model === "dall-e-3" && is_hd) {
				params.quality = "hd";
			}

			const response = await this.apiFun.images.generate(params);
			return response.data.map((x: any) => x.url);
		} catch (err) {
			this.display_error(err);
		}
	};

	whisper_api_call = async (input: Blob, language: string) => {
		try {
			const completion = await this.apiFun.audio.transcriptions.create({
				file: input,
				model: "whisper-1",
				language: language,
			});
			return completion.text;
		} catch (err) {
			this.display_error(err);
		}
	};

	text_to_speech_call = async (input_text: string) => {
		try {
			const mp3 = await this.apiFun.audio.speech.create({
				model: "tts-1",
				voice: "alloy",
				input: input_text,
			});

			const blob = new Blob([await mp3.arrayBuffer()], {
				type: "audio/mp3",
			});
			const url = URL.createObjectURL(blob);
			const audio = new Audio(url);

			await audio.play();
		} catch (err) {
			this.display_error(err);
		}
	};
}

export class AnthropicAssistant extends OpenAIAssistant {
	anthropicApiKey: string;

	constructor(
		openAIapiKey: string,
		anthropicApiKey: string,
		modelName: string,
		maxTokens: number,
	) {
		super(openAIapiKey, modelName, maxTokens);

		this.anthropicApiKey = anthropicApiKey;
	}

	text_api_call = async (
		prompt_list: { [key: string]: string }[],
		htmlEl?: HTMLElement,
		view?: MarkdownView,
	) => {
		try {
			const response = await request({
				url: "https://api.anthropic.com/v1/messages",

				method: "POST",

				headers: {
					"x-api-key": this.anthropicApiKey,
					"anthropic-version": "2023-06-01",
					"content-type": "application/json",
				},
				body: JSON.stringify({
					model: this.modelName,
					max_tokens: this.maxTokens,
					messages: prompt_list,
					// Stream mode not implemented yet.
					stream: false,
				}),
			});

			return JSON.parse(response).content[0].text;
		} catch (err) {
			this.display_error(err);
		}
	};
}
