import { supabase, Registration } from '../lib/supabase';
import { LumaService } from './lumaService';
import { GmailService } from './gmailService';

export interface EmailEntry {
  email: string;
  firstName: string;
  lastName: string;
}

export class RegistrationService {
  private gmailService: GmailService;

  constructor(gmailService: GmailService) {
    this.gmailService = gmailService;
  }

  async processRegistration(
    entry: EmailEntry,
    eventApiId: string,
    onProgress?: (status: string) => void
  ): Promise<Registration> {
    try {
      onProgress?.('Creating registration record...');
      const { data: registration, error: insertError } = await supabase
        .from('registrations')
        .insert({
          email: entry.email,
          first_name: entry.firstName,
          last_name: entry.lastName,
          event_api_id: eventApiId,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      try {
        onProgress?.('Registering to Luma event...');
        const lumaResponse = await LumaService.register({
          first_name: entry.firstName,
          last_name: entry.lastName,
          email: entry.email,
          event_api_id: eventApiId,
        });

        await supabase
          .from('registrations')
          .update({ luma_response: lumaResponse })
          .eq('id', registration.id);

        onProgress?.('Sending verification code...');
        await LumaService.sendVerificationCode(entry.email);

        await supabase
          .from('registrations')
          .update({ status: 'code_sent' })
          .eq('id', registration.id);

        onProgress?.('Waiting for verification code from Gmail...');
        const code = await this.gmailService.getVerificationCode(entry.email);

        await supabase
          .from('registrations')
          .update({ verification_code: code })
          .eq('id', registration.id);

        onProgress?.('Signing in with verification code...');
        const signInResponse = await LumaService.signInWithCode(entry.email, code);

        await supabase
          .from('registrations')
          .update({
            status: 'completed',
            luma_response: { ...lumaResponse, signIn: signInResponse },
          })
          .eq('id', registration.id);

        onProgress?.('Registration completed successfully!');

        const { data: finalData } = await supabase
          .from('registrations')
          .select()
          .eq('id', registration.id)
          .single();

        return finalData as Registration;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await supabase
          .from('registrations')
          .update({
            status: 'failed',
            error_message: errorMessage,
          })
          .eq('id', registration.id);

        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  async processBulkRegistrations(
    entries: EmailEntry[],
    eventApiId: string,
    onProgress?: (email: string, status: string) => void
  ): Promise<{ successful: Registration[]; failed: Array<{ email: string; error: string }> }> {
    const results = {
      successful: [] as Registration[],
      failed: [] as Array<{ email: string; error: string }>,
    };

    for (const entry of entries) {
      try {
        onProgress?.(entry.email, 'Starting...');
        const registration = await this.processRegistration(
          entry,
          eventApiId,
          (status) => onProgress?.(entry.email, status)
        );
        results.successful.push(registration);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failed.push({ email: entry.email, error: errorMessage });
        onProgress?.(entry.email, `Failed: ${errorMessage}`);
      }
    }

    return results;
  }

  async getRegistrations(): Promise<Registration[]> {
    const { data, error } = await supabase
      .from('registrations')
      .select()
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Registration[];
  }

  async deleteRegistration(id: string): Promise<void> {
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
