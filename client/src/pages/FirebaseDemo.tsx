import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { EmailPasswordSignIn } from '@/components/EmailPasswordSignIn';
import { FirebaseFileUpload } from '@/components/FirebaseFileUpload';
import { useAuth } from '@/contexts/AuthContext';
import { logOut } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export const FirebaseDemo = () => {
  const { firebaseUser, user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>([]);
  const { toast } = useToast();

  const handleFileUpload = (url: string, fileName: string) => {
    setUploadedFiles(prev => [...prev, { url, name: fileName }]);
    toast({
      title: "File uploaded!",
      description: `${fileName} has been uploaded to Firebase Storage.`,
    });
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setUploadedFiles([]);
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Firebase Integration Demo</h1>
          <p className="text-muted-foreground mt-2">
            Demonstrating Firebase Authentication, Firestore, and Storage integration
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Authentication Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-red-500">🔥</span>
                Firebase Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!firebaseUser ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign in with Google or use email/password to access Firebase features.
                  </p>
                  
                  {/* Google Sign In */}
                  <div>
                    <GoogleSignInButton />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">OR</span>
                    <Separator className="flex-1" />
                  </div>
                  
                  {/* Email/Password Sign In */}
                  <div>
                    <EmailPasswordSignIn />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={firebaseUser.photoURL || '/default-avatar.png'}
                      alt="Profile"
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{firebaseUser.displayName || 'User'}</p>
                      <p className="text-sm text-muted-foreground">{firebaseUser.email}</p>
                    </div>
                  </div>
                  <Button onClick={handleSignOut} variant="outline" size="sm">
                    Sign Out
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-blue-500">👤</span>
                User Profile (PostgreSQL)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">ID:</span>
                    <span className="text-sm text-muted-foreground ml-2">{user.id}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm text-muted-foreground ml-2">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Firebase UID:</span>
                    <span className="text-sm text-muted-foreground ml-2">{user.firebaseUid}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sign in to view your profile data stored in PostgreSQL.
                </p>
              )}
            </CardContent>
          </Card>

          {/* File Upload Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-orange-500">☁️</span>
                Firebase Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {firebaseUser ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload files to Firebase Storage. Uploaded files will be stored securely in the cloud.
                  </p>
                  <FirebaseFileUpload
                    onUpload={handleFileUpload}
                    maxSize={5}
                    acceptedTypes={['image/*', 'application/pdf', '.doc', '.docx', '.txt']}
                  />
                  
                  {uploadedFiles.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Uploaded Files:</h4>
                      <div className="grid gap-2">
                        {uploadedFiles.map((file, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <span className="text-sm truncate">{file.name}</span>
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              View File
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Please sign in to upload files to Firebase Storage.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h4 className="font-medium text-sm mb-2">🔐 Authentication</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Firebase Auth with Google Provider</li>
                  <li>• Automatic user profile creation</li>
                  <li>• Secure ID token verification</li>
                  <li>• PostgreSQL user management</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">💾 Data Storage</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• PostgreSQL for user profiles</li>
                  <li>• Firestore for documents (optional)</li>
                  <li>• Hybrid approach for scalability</li>
                  <li>• Secure API endpoints</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">📁 File Storage</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Firebase Storage for files</li>
                  <li>• Automatic file URL generation</li>
                  <li>• File type validation</li>
                  <li>• Progress tracking</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};