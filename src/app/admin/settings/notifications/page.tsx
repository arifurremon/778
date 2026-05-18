"use client";

import { AlertTriangle, Bell, CheckCircle2, Eye, Mail, ShieldX } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  type: 'email' | 'in-app';
  icon: React.ElementType;
  htmlPreview: string;
}

const TEMPLATES: NotificationTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Sent immediately after a user registers for the platform.',
    subject: 'Welcome to The Chattala! Let\'s get started.',
    type: 'email',
    icon: Mail,
    htmlPreview: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #f59e0b; padding: 32px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900;">Welcome to The Chattala!</h1>
        </div>
        <div style="padding: 32px; color: #333;">
          <p>Hi {{user.name}},</p>
          <p>We are thrilled to have you join our hyper-local community! Your account has been successfully created.</p>
          <p>Here are a few things you can do to get started:</p>
          <ul>
            <li>Complete your profile</li>
            <li>Connect with neighbours</li>
            <li>Explore local shops and services</li>
          </ul>
          <div style="text-align: center; margin: 32px 0;">
            <a href="#" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Explore Platform</a>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'verification',
    name: 'Email Verification',
    description: 'Sent when a user needs to verify their email address.',
    subject: 'Verify your email address for The Chattala',
    type: 'email',
    icon: CheckCircle2,
    htmlPreview: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
        <div style="padding: 32px; color: #333;">
          <h2 style="margin-top: 0;">Verify your email</h2>
          <p>Hi {{user.name}},</p>
          <p>Please use the button below to verify your email address and secure your account.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="#" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
          </div>
          <p style="font-size: 12px; color: #888;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `
  },
  {
    id: 'shop-verified',
    name: 'Shop Verified',
    description: 'Sent when an admin approves a marketplace shop.',
    subject: 'Your Shop has been Verified!',
    type: 'email',
    icon: CheckCircle2,
    htmlPreview: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #10b981; padding: 32px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900;">Congratulations!</h1>
        </div>
        <div style="padding: 32px; color: #333;">
          <p>Hi {{user.name}},</p>
          <p>Great news! Your shop <strong>"{{shop.name}}"</strong> has been verified by our moderation team.</p>
          <p>Your products are now visible to the entire community. Start managing your inventory and connecting with local buyers today.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="#" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'shop-rejected',
    name: 'Shop Rejected',
    description: 'Sent when an admin rejects a marketplace shop.',
    subject: 'Update on your Shop Application',
    type: 'email',
    icon: AlertTriangle,
    htmlPreview: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
        <div style="padding: 32px; color: #333;">
          <h2 style="margin-top: 0; color: #ef4444;">Shop Application Update</h2>
          <p>Hi {{user.name}},</p>
          <p>Unfortunately, your application for <strong>"{{shop.name}}"</strong> was not approved at this time.</p>
          <div style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <strong>Reason provided:</strong><br>
            <span style="color: #991b1b;">{{rejection.reason}}</span>
          </div>
          <p>Please address these concerns and feel free to submit a new application.</p>
        </div>
      </div>
    `
  },
  {
    id: 'account-suspended',
    name: 'Account Suspended',
    description: 'Sent when a user account is suspended for policy violations.',
    subject: 'Action Required: Account Suspended',
    type: 'email',
    icon: ShieldX,
    htmlPreview: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #ef4444; padding: 32px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900;">Account Suspended</h1>
        </div>
        <div style="padding: 32px; color: #333;">
          <p>Hi {{user.name}},</p>
          <p>Your account on The Chattala has been suspended due to violations of our community guidelines.</p>
          <div style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <strong>Reason for suspension:</strong><br>
            <span style="color: #991b1b;">{{suspension.reason}}</span>
          </div>
          <p>If you believe this is an error, please reply to this email to contact our support team.</p>
        </div>
      </div>
    `
  }
];

export default function NotificationTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary mb-2">
          <Bell size={12} />
          Communication
        </div>
        <h1 className="text-3xl font-black tracking-tight">Notification Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">Preview the automated emails sent to users during critical workflows.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((template) => (
          <Card key={template.id} className="border-border/50 shadow-sm flex flex-col group hover:shadow-md transition-all">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <template.icon size={20} />
                </div>
                <Badge variant="outline" className="bg-muted text-[8px] font-black uppercase tracking-widest border-border/50">
                  {template.type}
                </Badge>
              </div>
              <CardTitle className="text-lg font-black">{template.name}</CardTitle>
              <CardDescription className="line-clamp-2 h-10 mt-1">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <div className="bg-muted/30 rounded-lg p-3 text-xs border border-border/50">
                <span className="font-bold text-muted-foreground">Subject:</span> 
                <span className="ml-2 font-medium">{template.subject}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                variant="outline" 
                className="w-full gap-2 font-bold"
                onClick={() => setSelectedTemplate(template)}
              >
                <Eye size={16} /> Preview Template
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden bg-muted/20">
          <DialogHeader className="p-6 bg-background border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {selectedTemplate && <selectedTemplate.icon size={20} />}
              </div>
              <div>
                <DialogTitle className="text-xl font-black">{selectedTemplate?.name}</DialogTitle>
                <DialogDescription>
                  Subject: <span className="font-bold text-foreground">{selectedTemplate?.subject}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 bg-[#f9fafb] flex justify-center">
            {/* The actual HTML preview wrapper */}
            {/* SAFE: notification templates are static/hardcoded, not user-generated */}
            <div 
              className="w-full max-w-lg bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100"
              dangerouslySetInnerHTML={{ __html: selectedTemplate?.htmlPreview || '' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
