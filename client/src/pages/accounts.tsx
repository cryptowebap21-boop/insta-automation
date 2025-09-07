import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function AccountsPage() {
  const [newUsername, setNewUsername] = useState('');
  const [sessionCookies, setSessionCookies] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sendMessage } = useWebSocket();

  // Fetch Instagram accounts
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['/api/instagram-accounts'],
    retry: false,
  });

  // Create new Instagram account
  const createAccountMutation = useMutation({
    mutationFn: async (data: { username: string; sessionData?: string }) => {
      return apiRequest('POST', '/api/instagram-accounts', data);
    },
    onSuccess: () => {
      toast({
        title: "Account Added",
        description: "Instagram account has been added successfully!",
      });
      setNewUsername('');
      setSessionCookies('');
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/instagram-accounts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Account",
        description: error.message || "Could not add Instagram account",
        variant: "destructive",
      });
    },
  });

  // Toggle account status
  const toggleAccountMutation = useMutation({
    mutationFn: async ({ accountId, isActive }: { accountId: string; isActive: boolean }) => {
      return apiRequest('PATCH', `/api/instagram-accounts/${accountId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/instagram-accounts'] });
      toast({
        title: "Account Updated",
        description: "Account status has been updated.",
      });
    },
  });

  // Delete account
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return apiRequest('DELETE', `/api/instagram-accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/instagram-accounts'] });
      toast({
        title: "Account Removed",
        description: "Instagram account has been removed.",
      });
    },
  });

  const handleAddAccount = () => {
    if (!newUsername.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter an Instagram username",
        variant: "destructive",
      });
      return;
    }

    createAccountMutation.mutate({
      username: newUsername.trim(),
      sessionData: sessionCookies.trim() || undefined
    });
  };

  const handleToggleAccount = (accountId: string, isActive: boolean) => {
    toggleAccountMutation.mutate({ accountId, isActive });
  };

  const handleDeleteAccount = (accountId: string) => {
    if (confirm('Are you sure you want to remove this Instagram account?')) {
      deleteAccountMutation.mutate(accountId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gradient">
            <i className="fas fa-users text-primary mr-3"></i>
            Instagram Accounts
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage your Instagram accounts for automation campaigns. Add session cookies to maintain login state.
          </p>
        </div>

        {/* Add Account Button */}
        <div className="text-center">
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            data-testid="button-add-account"
          >
            <i className="fas fa-plus mr-2"></i>
            Add Instagram Account
          </Button>
        </div>

        {/* Add Account Form */}
        {showAddForm && (
          <Card className="glass-card p-6 max-w-lg mx-auto">
            <div className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm font-medium">
                  Instagram Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="@your_instagram_handle"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="mt-1"
                  data-testid="input-username"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter without the @ symbol
                </p>
              </div>

              <div>
                <Label htmlFor="session-cookies" className="text-sm font-medium">
                  Session Cookies (Optional)
                </Label>
                <Input
                  id="session-cookies"
                  type="text"
                  placeholder="sessionid=abc123; csrftoken=def456..."
                  value={sessionCookies}
                  onChange={(e) => setSessionCookies(e.target.value)}
                  className="mt-1"
                  data-testid="input-session-cookies"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste your Instagram session cookies to stay logged in
                </p>
              </div>

              <div className="flex space-x-3">
                <Button 
                  onClick={handleAddAccount}
                  disabled={createAccountMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-account"
                >
                  {createAccountMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Add Account
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  data-testid="button-cancel-add"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Accounts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(accounts as any[]).length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl text-muted-foreground mb-4">
                <i className="fas fa-instagram"></i>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Instagram Accounts</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Add your Instagram accounts to start running DM campaigns and manage multiple profiles.
              </p>
            </div>
          ) : (
            (accounts as any[]).map((account: any) => (
              <Card key={account.id} className="glass-card p-6" data-testid={`account-card-${account.id}`}>
                <div className="space-y-4">
                  {/* Account Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-instagram text-white text-xl"></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg" data-testid={`account-username-${account.id}`}>
                          @{account.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {account.sessionData ? 'Session Saved' : 'No Session'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={account.isActive}
                        onCheckedChange={(checked) => handleToggleAccount(account.id, checked)}
                        data-testid={`account-toggle-${account.id}`}
                      />
                    </div>
                  </div>

                  {/* Account Stats */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-muted">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400" data-testid={`account-campaigns-${account.id}`}>
                        {account.campaignsCount || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Campaigns</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400" data-testid={`account-messages-${account.id}`}>
                        {account.messagesSent || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Messages Sent</div>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        // Update session cookies functionality
                        const newCookies = prompt('Enter new session cookies:', account.sessionData || '');
                        if (newCookies !== null) {
                          // Update account with new cookies
                          console.log('Update cookies for', account.id, newCookies);
                        }
                      }}
                      data-testid={`account-update-${account.id}`}
                    >
                      <i className="fas fa-cookie-bite mr-2"></i>
                      Update Session
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                      data-testid={`account-delete-${account.id}`}
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Remove
                    </Button>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                      account.isActive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        account.isActive ? 'bg-green-400' : 'bg-gray-400'
                      }`}></div>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Help Section */}
        <Card className="glass-card p-6">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground flex items-center">
              <i className="fas fa-info-circle text-blue-400 mr-3"></i>
              How to Get Session Cookies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Chrome/Edge:</h4>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Go to Instagram.com and log in</li>
                  <li>2. Press F12 to open Developer Tools</li>
                  <li>3. Go to Application → Cookies → instagram.com</li>
                  <li>4. Copy sessionid and csrftoken values</li>
                  <li>5. Format: sessionid=value; csrftoken=value;</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Firefox:</h4>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Go to Instagram.com and log in</li>
                  <li>2. Press F12 to open Developer Tools</li>
                  <li>3. Go to Storage → Cookies → instagram.com</li>
                  <li>4. Copy sessionid and csrftoken values</li>
                  <li>5. Paste in the session cookies field above</li>
                </ol>
              </div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <i className="fas fa-exclamation-triangle text-yellow-400 mt-0.5"></i>
                <div className="text-sm">
                  <p className="text-yellow-300 font-medium">Important:</p>
                  <p className="text-yellow-200">
                    Session cookies allow the app to send DMs on your behalf without requiring you to log in each time. 
                    Keep these secure and never share them with others.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}