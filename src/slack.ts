import * as github from '@actions/github';
import * as core from '@actions/core';
import { Status } from './utils';
import { SectionBlock, MessageAttachment, MrkdwnElement } from '@slack/types';
import {
  IncomingWebhook, IncomingWebhookSendArguments,
  IncomingWebhookResult
} from '@slack/webhook';

export class Slack extends IncomingWebhook {
  // 0: failure, 1: success
  static readonly color: string[] = ['#cb2431', '#2cbe4e'];

  constructor(
    url: string,
    username: string = 'Github Actions',
    icon_emoji: string = 'github',
    channel: string = '#general'
  ) {
    super(url, {username, icon_emoji, channel});
  }

  /**
   * Get slack blocks UI
   */
  protected get blocks(): SectionBlock {
    const context = github.context;
    const { sha, eventName, workflow, ref } = context;
    const { owner, repo } = context.repo;
    const repo_url: string = `https://github.com/${owner}/${repo}`;
    const action_url: string = `${repo_url}/commit/${sha}/checks`;

    const blocks: SectionBlock = {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*repository*\n<${repo_url}|${owner}/${repo}>` },
        { type: 'mrkdwn', text: `*ref*\n${ref}` },
        { type: 'mrkdwn', text: `*event name*\n${eventName}` },
        { type: 'mrkdwn', text: `*workflow*\n<${action_url}|${workflow}>` },
      ]
    }

    return blocks;
  }

  /**
   * Generate slack payload
   */
  protected generatePayload(status: Status, text: string): IncomingWebhookSendArguments {
    const text_for_slack: MrkdwnElement = { type: 'mrkdwn', text };
    const blocks: SectionBlock = { ...this.blocks, text: text_for_slack };
    const attachments: MessageAttachment = {
      color: Slack.color[status],
      blocks: [blocks]
    }
    const payload: IncomingWebhookSendArguments = {
      attachments: [attachments]
    }

    core.debug(`Generated payload for slack: ${JSON.stringify(payload)}`);

    return payload;
  }

  /**
   * Notify information about github actions to Slack
   */
  public async notify(status: Status, text: string): Promise<IncomingWebhookResult> {
    try {
      const payload: IncomingWebhookSendArguments = this.generatePayload(status, text);
      const result = await this.send(payload);

      core.debug('Sent message to Slack');

      return result;
    } catch (err) {
      throw err;
    }
  }
}