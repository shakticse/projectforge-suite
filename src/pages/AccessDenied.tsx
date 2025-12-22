import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">You do not have permission to view this page. If you believe this is an error, contact your administrator.</p>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/', { replace: true })}>Go to Dashboard</Button>
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
