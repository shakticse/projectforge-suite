import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { storeService } from '@/services/storeService';
import { userService } from '@/services/userService';
import * as CSC from "react-country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Plus, MoreVertical, Edit, Trash2, Eye, Search, Filter, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from '@/lib/utils';

const storeSchema = z.object({
  store_name: z.string().min(3, 'Store name is required'),
  store_description: z.string().optional(),
  
  store_address: z.string().min(5, 'Store address is required'),
  state: z.string().min(2, 'State is required'),
  city: z.string().min(2, 'City is required'),
  pincode: z.string().min(6, 'Pincode must be at least 4 characters'),
  is_site_store: z.boolean().optional(),
});

type StoreFormData = z.infer<typeof storeSchema>;

interface Store {
  id: string | number;
  store_name: string;
  store_description?: string;
  parent_store?: string | null;
  parent_store_name?: string;
  store_manager?: string; // user id or name
  store_manager_name?: string;
  store_address?: string;
  state?: string;
  state_name?: string;
  city?: string;
  pincode?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive';
  is_site_store?: boolean;
}

const Stores = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingStore, setDeletingStore] = useState<Store | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingStore, setViewingStore] = useState<Store | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [managers, setManagers] = useState<Array<{ id: string; name: string }>>([]);
  const [parentStores, setParentStores] = useState<Array<{ id: string; name: string }>>([]);
  const [popupMessage, setPopupMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });
  const [deletePopupMessage, setDeletePopupMessage] = useState<{ type: 'error' | null; text: string }>({ type: null, text: '' });

  // Country-state-city lists for India
  const [statesList, setStatesList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [indiaCountryId, setIndiaCountryId] = useState<number | null>(null);

  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      store_name: '',
      store_description: '',

      store_address: '',
      state: '',
      city: '',
      pincode: '',
      is_site_store: false,
    },
  });

  const stateValue = form.watch('state');

  const fetchStores = async () => {
    setLoadingStores(true);
    try {
      const res: any = await storeService.getAllStores();
      const countries: any = await CSC.GetCountries();
      //console.log(countries);
      const india = (countries || []).find((c: any) => String(c.name) == 'India');
      //console.log(india);
      const statesData: any = await CSC.GetState(india.id);
      //console.log(statesData);
      const mapped: Store[] = (res || []).map((s: any) => {
        const stateRaw = s.storeState ?? s.state ?? s.state_name ?? s.store_state ?? '';
        const foundState = (statesData || []).find((st: any) => String(st.name).toLowerCase() === String(stateRaw).toLowerCase() || String(st.id) === String(stateRaw));
        const stateId = foundState ? foundState.id : stateRaw;
        const stateName = foundState ? foundState.name : stateRaw;

        return {
          id: s.id ?? s.StoreId ?? s.storeId,
          store_name: s.store_name ?? s.name ?? s.storeName ?? '',
          store_description: s.store_description ?? s.storeDescription ?? '',
          store_address: s.store_address ?? s.storeAddress ?? '',
          state_name: stateName,
          state: s.storeState ?? '',
          city: s.storeCity ?? '',
          pincode: s.pincode ?? s.zip ?? '',
          is_site_store: s.is_site_store ?? s.isSiteStore ?? false,
          created_at: s.CreatedAt ?? s.createdAt ?? '',
          updated_at: s.UpdateDate ?? s.updatedAt ?? '',
          status: 'active'
        };
      });
      setStores(mapped);
      // Also populate parent store dropdown from result
      //setParentStores(mapped.map(m => ({ id: String(m.id), name: m.store_name })));
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || err?.message || 'Failed to load stores', variant: 'destructive' });
    } finally {
      setLoadingStores(false);
    }
  };

    useEffect(() => {
      fetchStores();

      const loadMeta = async () => {
        try {
          const r: any = await userService.getAllManagers();
          setManagers((r || []).map((x: any) => ({ id: String(x.RoleId ?? x.id ?? x.userId ?? x.UserId ?? x.id ?? ''), name: x.firstName ?? x.name ?? x.fullName ?? x.name ?? x })));
        } catch (err) {
          console.warn('Failed to load managers', err);
        }

        try {
          const s: any = await storeService.getAllStores();
          setParentStores((s || []).map((x: any) => ({ id: String(x.StoreId ?? x.id ?? ''), name: x.storeName ?? x.store_name ?? x.name ?? x })));
        } catch (err) {
          console.warn('Failed to load parent stores', err);
        }
      };

      loadMeta();
    }, []);

  // Load Indian states for dropdown
  useEffect(() => {
    const loadIndia = async () => {
      try {
        const countries: any = await CSC.GetCountries();
        const india = (countries || []).find((c: any) => String(c.name) === 'India');
        if (india) {
          setIndiaCountryId(india.id);
          const sts: any = await CSC.GetState(india.id);
          setStatesList(sts || []);
        }
      } catch (err) {
        console.warn('Failed to load India states', err);
      }
    };

    loadIndia();
  }, []);

  // Update cities when selected state changes
  useEffect(() => {
    const loadCities = async () => {
      if (!indiaCountryId || !stateValue) {
        setCitiesList([]);
        return;
      }
      try {
        const c: any = await CSC.GetCity(indiaCountryId, Number(stateValue));
        setCitiesList(c || []);
      } catch (err) {
        console.warn('Failed to load cities', err);
        setCitiesList([]);
      }
    };

    loadCities();
  }, [indiaCountryId, stateValue]);

  // Filter and sort stores
  const filteredStores = stores.filter(store =>
    store.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.store_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStores = filteredStores.sort((a, b) => {
    const aValue = a[sortBy as keyof Store];
    const bValue = b[sortBy as keyof Store];

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedStores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStores = sortedStores.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const onSubmit = async (data: StoreFormData) => {
    try {
      const payload: any = {
        storeName: data.store_name,
        storeDescription: data.store_description,
        
        storeAddress: data.store_address,
        storestate: statesList.find(s => s.id == data.state).name,
        storecity: data.city,
        pincode: data.pincode,
        isSiteStore: !!data.is_site_store,
      };

      if (editingStore) {
        // Always re-load from API before update (requirement)
        const fromApi: any = await storeService.getStoreById(editingStore.id);
        const id = editingStore.id;
        const res = await storeService.updateStore(id, payload);
        toast({ title: 'Store updated', description: res?.message || 'Store updated successfully.' });
        setIsAddOpen(false);
        setEditingStore(null);
        form.reset();
        fetchStores();
        setPopupMessage({ type: null, text: '' });
      } else {
        const res = await storeService.createStore(payload);
        toast({ title: 'Store added', description: res?.message || 'New store has been successfully created.' });
        setIsAddOpen(false);
        form.reset();
        fetchStores();
        setPopupMessage({ type: null, text: '' });
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to save store. Please try again.';
      setPopupMessage({ type: 'error', text: String(msg) });
      toast({ title: 'Error', description: String(msg), variant: 'destructive' });
    }
  };

  const handleDelete = (store: Store) => {
    setDeletingStore(store);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingStore) return;
    setIsDeleting(true);
    try {
      await storeService.deleteStore(deletingStore.id);
      toast({ title: 'Store deleted', description: 'Store deleted successfully.' });
      setIsDeleteOpen(false);
      setDeletingStore(null);
      fetchStores();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete store';
      setDeletePopupMessage({ type: 'error', text: String(msg) });
      toast({ title: 'Error', description: String(msg), variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = async (storeId: string | number) => {
    try {
      const s: any = await storeService.getStoreById(storeId);
      const stateRaw = s.state ?? s.storeState ?? s.state_name ?? '';
      let stateId = stateRaw;
      let stateName = stateRaw;
      try {
        const countries: any = await CSC.GetCountries();
        const india = (countries || []).find((c: any) => String(c.name) === 'India');
        if (india) {
          const states = await CSC.GetState(india.id);
          const foundState = (states || []).find((st: any) => String(st.name).toLowerCase() === String(stateRaw).toLowerCase() || String(st.id) === String(stateRaw));
          if (foundState) {
            stateId = foundState.id;
            stateName = foundState.name;
          }
        }
      } catch (err) { }

      const model: Store = {
        id: s.id ?? s.StoreId ?? storeId,
        store_name: s.storeName ?? s.name ?? '',
        store_description: s.storeDescription ?? s.description ?? '',
        
        store_address: s.storeAddress ?? s.address ?? '',
        state: stateId,
        state_name: stateName,
        city: s.city ?? s.storeCity ?? '',
        pincode: String(s.pincode) ?? '',
        is_site_store: s.is_site_store ?? s.isSiteStore ?? false,
        created_at: s.CreatedAt ?? s.createdAt ?? '',
        updated_at: s.UpdateDate ?? s.updateDate ?? '',
        status: 'active'
      };

      setEditingStore(model);
      form.reset({
        store_name: model.store_name,
        store_description: model.store_description,
        
        store_address: model.store_address,
        state: model.state ? String(model.state) : '',
        city: model.city,
        pincode: model.pincode,
        is_site_store: !!model.is_site_store,
      });
      setPopupMessage({ type: null, text: '' });
      setIsAddOpen(true);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || err?.message || 'Failed to load store for editing', variant: 'destructive' });
    }
  };

  const openView = async (storeId: string | number) => {
    try {
      const s: any = await storeService.getStoreById(storeId);
      const stateRaw = s.state ?? s.storeState ?? s.state_name ?? '';
      let stateId = stateRaw;
      let stateName = stateRaw;
      try {
        const countries: any = await CSC.GetCountries();
        const india = (countries || []).find((c: any) => String(c.name).toLowerCase() === 'india' || String(c.name).toLowerCase().includes('india'));
        if (india) {
          const states = await CSC.GetState(india.id);
          const foundState = (states || []).find((st: any) => String(st.name).toLowerCase() === String(stateRaw).toLowerCase() || String(st.id) === String(stateRaw));
          if (foundState) {
            stateId = foundState.id;
            stateName = foundState.name;
          }
        }
      } catch (err) { }

      const model: Store = {
        id: s.id ?? s.StoreId ?? storeId,
        store_name: s.storeName ?? s.name ?? '',
        store_description: s.storeDescription ?? s.description ?? '',
        
        store_address: s.storeAddress ?? s.address ?? '',
        state: stateId,
        state_name: stateName,
        city: s.city ?? s.storeCity ?? '',
        pincode: s.pincode ?? s.zip ?? '',
        is_site_store: s.is_site_store ?? s.isSiteStore ?? false,
        created_at: s.CreatedAt ?? s.createdAt ?? '',
        updated_at: s.UpdateDate ?? s.updateDate ?? '',
        status: 'active'
      };
      setViewingStore(model);
      setIsViewOpen(true);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || err?.message || 'Failed to load store details', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Store Management</h1>
          <p className="text-muted-foreground mt-1">Manage Stores</p>
        </div>
        <div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2" onClick={() => { setEditingStore(null); form.reset(); form.clearErrors(); setPopupMessage({ type: null, text: '' }); }}>
                <Plus className="h-4 w-4" />
                Add Store
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStore ? 'Edit Store' : 'Add New Store'}</DialogTitle>
                <DialogDescription>{editingStore ? 'Update store details below.' : 'Fill in the details below to create a new store.'}</DialogDescription>
              </DialogHeader>

              {popupMessage.type && (
                <div className="px-4">
                  <Alert variant={popupMessage.type === 'error' ? 'destructive' : 'default'}>
                    <AlertTitle>{popupMessage.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                    <AlertDescription>{popupMessage.text}</AlertDescription>
                  </Alert>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">General</h3>

                      <FormField
                        control={form.control}
                        name="store_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter store name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="store_description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/*<FormField
                        control={form.control}
                        name="parent_store"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent Store</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select parent store" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {parentStores?.map(p => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="store_manager"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Manager *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select manager" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {managers.map(m => (
                                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />*/}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Location</h3>

                      <FormField
                        control={form.control}
                        name="store_address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address *</FormLabel>
                            <FormControl>
                              <Input placeholder="Street address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State *</FormLabel>
                            <FormControl>
                              <Select onValueChange={(val) => field.onChange(val)} defaultValue={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">Select State</SelectItem>
                                  {statesList.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Select onValueChange={(val) => field.onChange(val)} defaultValue={field.value} disabled={citiesList.length === 0}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select city" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">Select City</SelectItem>
                                  {citiesList.map((c: any) => (
                                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode *</FormLabel>
                            <FormControl>
                              <Input placeholder="Pincode / ZIP" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/*<FormField
                        control={form.control}
                        name="is_site_store"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                            </FormControl>
                            <FormLabel className="m-0">Is Site Store</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />*/}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddOpen(false);
                        form.reset();
                        setEditingStore(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">{editingStore ? 'Update Store' : 'Add Store'}</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if (open) setDeletePopupMessage({ type: null, text: '' }); if (!open) setDeletingStore(null); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
              </DialogHeader>

              {deletePopupMessage.type && (
                <div className="px-4">
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{deletePopupMessage.text}</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="py-2">
                <p>Are you sure you want to delete store <strong>{deletingStore?.store_name}</strong>? This action cannot be undone.</p>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setDeletingStore(null); setDeletePopupMessage({ type: null, text: '' }); }} disabled={isDeleting}>Cancel</Button>
                <Button className="text-destructive" onClick={confirmDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Store Details</DialogTitle>
                <DialogDescription>Details for {viewingStore?.store_name}</DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <div><strong>Name:</strong> {viewingStore?.store_name}</div>
                <div><strong>Description:</strong> {viewingStore?.store_description || 'NA'}</div>
                <div><strong>Parent:</strong> {viewingStore?.parent_store_name || 'NA'}</div>
                <div><strong>Manager:</strong> {viewingStore?.store_manager_name || 'NA'}</div>
                <div><strong>Address:</strong> {viewingStore?.store_address || 'NA'}</div>
                <div><strong>City/State/Pincode:</strong> {viewingStore?.city || 'NA'}, {viewingStore?.state_name || viewingStore?.state || 'NA'}, {viewingStore?.pincode || 'NA'}</div>
                <div><strong>Site Store:</strong> {viewingStore?.is_site_store ? 'Yes' : 'No'}</div>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => { setIsViewOpen(false); setViewingStore(null); }}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>


      {/* Filters and Search */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search store..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stores Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Stores List</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStores ? (
            <div className="mb-4 py-6 text-center text-sm text-muted-foreground">Loading store...</div>
          ) : stores.length === 0 ? (
            <div className="mb-4 py-6 text-center text-sm text-muted-foreground">No store found.</div>
          ) : null}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Store State</TableHead>
                  <TableHead>Store City</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                
                {console.log(paginatedStores)}
                {paginatedStores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.store_name}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">
                      {store.store_description}
                    </TableCell>
                    <TableCell className="font-medium">
                      {store.store_address}
                    </TableCell>
                    <TableCell className="font-medium">
                      {store.state}
                    </TableCell>
                    <TableCell className="font-medium">
                      {store.city}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDateTime(store.updated_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openView(store.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(store.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(store)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loadingStores ? (
          <div className="mb-4 py-6 text-center text-sm text-muted-foreground">Loading stores...</div>
        ) : stores.length === 0 ? (
          <div className="mb-4 py-6 text-center text-sm text-muted-foreground">No stores found.</div>
        ) : null}

        {stores.map(store => (
          <Card key={store.id} className="glass-card">
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{store.store_name}</h3>
                  <div className="text-sm text-muted-foreground">{store.store_manager_name || '—'}</div>
                  <div className="mt-2 text-sm">{store.store_description}</div>
                  <div className="mt-3 text-xs text-muted-foreground">{store.city}, {store.state} {store.pincode}</div>
                </div>

                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openView(store.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(store.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(store)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div> */}
    </div >
  );
};

export default Stores;
