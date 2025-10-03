import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, Database, UserCheck } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      <main id="main-content" className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: October 3, 2025
            </p>
          </div>

          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Our Commitment to Your Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                At OmniLink, we take your privacy seriously. This policy explains how we collect, 
                use, and protect your personal information.
              </p>
              <p className="text-sm text-muted-foreground">
                We are committed to compliance with GDPR, CCPA, and PIPEDA privacy regulations.
              </p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                What Data We Collect
              </CardTitle>
              <CardDescription>
                We only collect data necessary to provide our services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Account Information</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Email address (for authentication)</li>
                  <li>Display name and profile information (optional)</li>
                  <li>Account creation and last login timestamps</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">User Content</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Links, files, and descriptions you create</li>
                  <li>Integration configurations and automation settings</li>
                  <li>All content is associated with your user account only</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Technical Data</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Browser type and version (for compatibility)</li>
                  <li>IP address (for security and fraud prevention)</li>
                  <li>Session information (encrypted and temporary)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                How We Use Your Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span className="text-sm">Provide and maintain the OmniLink service</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span className="text-sm">Authenticate and authorize access to your account</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span className="text-sm">Improve our service through anonymized usage analytics (opt-in only)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span className="text-sm">Communicate important service updates and security alerts</span>
                </li>
                <li className="flex gap-3 text-muted-foreground">
                  <span className="text-destructive">✗</span>
                  <span className="text-sm">We never sell your data to third parties</span>
                </li>
                <li className="flex gap-3 text-muted-foreground">
                  <span className="text-destructive">✗</span>
                  <span className="text-sm">We never use your data for advertising purposes</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• End-to-end encryption for data transmission (TLS/HTTPS)</li>
                <li>• Encrypted storage of sensitive information</li>
                <li>• Row-level security policies ensuring data isolation</li>
                <li>• Regular security audits and vulnerability assessments</li>
                <li>• Two-factor authentication support (coming soon)</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Under GDPR, CCPA, and PIPEDA, you have the following rights:
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Request a copy of all data we hold about you
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Rectification</h4>
                  <p className="text-sm text-muted-foreground">
                    Update or correct inaccurate information
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Deletion</h4>
                  <p className="text-sm text-muted-foreground">
                    Request deletion of your account and all data
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Portability</h4>
                  <p className="text-sm text-muted-foreground">
                    Export your data in a machine-readable format
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pt-4">
                To exercise any of these rights, contact us at:{' '}
                <a href="mailto:privacy@omnilink.app" className="text-primary hover:underline">
                  privacy@omnilink.app
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                If you have questions about this Privacy Policy or our data practices:
              </p>
              <div className="text-sm space-y-1">
                <p>Email: <a href="mailto:privacy@omnilink.app" className="text-primary hover:underline">privacy@omnilink.app</a></p>
                <p className="text-muted-foreground">We will respond within 30 days</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
