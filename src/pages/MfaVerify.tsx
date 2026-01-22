import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mfaService } from '@/services/mfaService';
import { toast } from 'sonner';
import { roleService } from '@/services/roleService';
import { Link } from "react-router-dom";
import { Building2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

const MfaVerify = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mfaUser, setMfaUser] = useState<string | null>(null);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // retrieve pending mfa token from sessionStorage
    const pending = sessionStorage.getItem('mfa_pending');
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        setMfaUser(parsed.email);
        //setMfaToken(parsed.token);
      } catch (e) {
        console.warn('Invalid mfa_pending payload', e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // if (!mfaToken) {
    //   setError('Missing MFA session. Please login again.');
    //   return;
    // }
    if (!/^[0-9]{6}$/.test(code)) {
      setError('Enter a valid 6-digit code');
      return;
    }
    setIsLoading(true);
    try {
      const res = await mfaService.verifyCode(mfaUser, code);
        const { token, name, email, role, department, avatar, message } = res;
        if (token) {
            const user = {
            name: name,
            email: email,
            role: role,
            department: department,
            avatar: avatar
            };
            // Fetch role permissions and menus to build allowed paths (best-effort)
            try {
            const menus: any = await roleService.getAllMenu();

            // Determine role id when available
            let roleId: string | number | undefined = undefined;
            if (typeof role === 'number' || /^[0-9]+$/.test(String(role))) roleId = role;
            // If role appears to be a name, try to find it in roles list
            if (!roleId) {
                try {
                const allRoles: any = await roleService.getAllRoles();
                const found = (allRoles || []).find((r: any) => (r.Name ?? r.name ?? '').toLowerCase() === String(role).toLowerCase());
                if (found) roleId = found.RoleId ?? found.id ?? found.roleId;
                } catch (e) {
                // ignore
                }
            }

            let permissions: any[] = [];
            if (roleId) {
                try {
                const roleDetails: any = await roleService.getRoleById(roleId);
                permissions = roleDetails?.Permissions || roleDetails?.permissions || [];
                } catch (e) {
                // ignore
                }
            }

            // Build allowed menu names and attach
            const allowedMenus = (permissions || []).filter(p => p.CanView || p.canView || p.can_view).map((p: any) => Number(p.MenuId ?? p.menuId ?? p.menu_id));
            const allowedMenuNames = (menus || []).filter((m: any) => allowedMenus.includes(Number(m.id))).map((m: any) => m.menuName);
            (user as any).allowedMenuNames = allowedMenuNames;
            // Also attach raw permissions for later checks
            (user as any).permissions = permissions;
            } catch (e) {
            // best-effort: if fetching menu/permissions fails, don't block login
            console.warn('Failed to fetch role permissions on login', e);
            }
            console.log(token);
            console.log(user);
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user', JSON.stringify(user));
            sessionStorage.removeItem('mfa_pending');
            toast.success('MFA verification successful. You are now signed in.');
            //return { token, user };
            navigate('/', { replace: true });
        }
        else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            toast.error('Login Failed');
            setAttemptsLeft(prev => (prev === null ? 2 : prev - 1));
            navigate('/login', { replace: true });
            //throw(message);
        }

    //   if (res.accessToken) {
    //     // successful verification — complete login
    //     authService.setSession(res.accessToken as string, res.user || {});
    //     sessionStorage.removeItem('mfa_pending');
    //     toast.success('MFA verification successful. You are now signed in.');
    //     navigate('/', { replace: true });
    //   } else if (res.success) {
    //     // edge case: success without tokens
    //     sessionStorage.removeItem('mfa_pending');
    //     toast.success('MFA verification successful. Please sign in.');
    //     navigate('/login', { replace: true });
    //   } else {
    //     setError('Invalid or expired code');
    //     setAttemptsLeft(prev => (prev === null ? 2 : prev - 1));
    //   }
    } catch (err: any) {
      console.log(err);
      
      setError(err?.response?.data?.message || 'Failed to verify code');
      setAttemptsLeft(prev => (prev === null ? 2 : prev - 1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-3xl font-bold">Two Factor Authentication</h1>
              <p className="text-muted-foreground">Enter the 6-digit code from your Google Authenticator app to complete sign in.</p>
            </div>
    
            <Card className="glass-card shadow-elegant">
              <CardHeader>
                <CardTitle className="text-center">Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
    
                  <div className="space-y-2">
                    <Label htmlFor="code">Authentication Code</Label>
                    <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="6 digit code" maxLength={6} disabled={isLoading} />
                  </div>
    
                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>{isLoading ? 'Verifying...' : 'Verify'}</Button>
                </form>
   
                <div className="mt-6 pt-6 border-t text-center">
                  <Link to="/login" className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-2">
                   <ArrowLeft className="h-4 w-4" /> Back to Login</Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
  );
};

export default MfaVerify;
