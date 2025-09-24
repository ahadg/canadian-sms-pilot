// components/ContactManager.tsx
import { useState, useEffect } from "react";
import { 
  X, Upload, Download, Plus, Trash2, Loader2, Search, Filter, 
  ChevronDown, ChevronUp, Edit, Save, X as CloseIcon, 
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useContactManagement, type ContactFilters } from "@/hooks/useContactManagement";
import { toast } from "sonner";

interface ContactManagerProps {
  contactListId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


export function ContactManager({ contactListId, open, onOpenChange }: ContactManagerProps) {
  const {
    contacts,
    contactLists,
    loading,
    importing,
    fetchContacts,
    addContact,
    updateContact,
    deleteContact,
    importContactsFromFile,
    exportContacts
  } = useContactManagement();

  const [activeTab, setActiveTab] = useState("view");
  const [filters, setFilters] = useState<ContactFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [editableContacts, setEditableContacts] = useState<any[]>([]);
  const [newContact, setNewContact] = useState({
    phone_number: '',
    country_code: '+1',
    first_name: '',
    last_name: '',
    email: '',
    //company: '',
    opted_in_count: 1,
    opted_out_count: 0,
  });

  const currentContactList = contactLists.find(list => list.id === contactListId);

  useEffect(() => {
    if (open && contactListId) {
      loadContacts();
    }
  }, [open, contactListId]);

  useEffect(() => {
    setEditableContacts(contacts);
  }, [contacts]);

  const loadContacts = async () => {
    try {
      await fetchContacts(contactListId, { ...filters, search: searchTerm || undefined });
    } catch (error) {
      toast.error('Failed to load contacts');
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Debounced search would be better here
    setTimeout(() => loadContacts(), 300);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['.csv', 'application/vnd.ms-excel', 'text/csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(`.${fileExtension}`) && !validTypes.includes(file.type)) {
      toast.error('Please upload a CSV file');
      return;
    }

    try {
      const result = await importContactsFromFile(contactListId, file);
      
      if (result.failed > 0) {
        toast.warning(`Imported ${result.success} contacts, ${result.failed} failed`, {
          description: result.errors.slice(0, 3).join(', ') + (result.errors.length > 3 ? '...' : '')
        });
      } else {
        toast.success(`Successfully imported ${result.success} contacts`);
      }
      
      event.target.value = '';
    } catch (error: any) {
      toast.error(error.message || 'Failed to import contacts');
    }
  };

  const handleAddContact = async () => {
    if (!newContact.phone_number.trim()) {
      toast.error('Phone number is required');
      return;
    }

    try {
      await addContact(contactListId, newContact);
      setNewContact({
        phone_number: '',
        country_code: '+1',
        first_name: '',
        last_name: '',
        email: '',
        //company: '',
        opted_in_count: 0,
        opted_out_count: 0,
      });
      toast.success('Contact added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add contact');
    }
  };

  const handleEditContact = (contactId: string) => {
    setEditableContacts(prev => prev.map(contact => 
      contact.id === contactId 
        ? { ...contact, isEditing: true, tempData: { ...contact } }
        : contact
    ));
  };

  const handleSaveContact = async (contactId: string) => {
    const contact = editableContacts.find(c => c.id === contactId);
    if (!contact?.tempData) return;

    try {
      await updateContact(contactId, contact.tempData);
      setEditableContacts(prev => prev.map(c => 
        c.id === contactId ? { ...c, isEditing: false, tempData: undefined } : c
      ));
      toast.success('Contact updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update contact');
    }
  };

  const handleCancelEdit = (contactId: string) => {
    setEditableContacts(prev => prev.map(contact => 
      contact.id === contactId 
        ? { ...contact, isEditing: false, tempData: undefined }
        : contact
    ));
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      await deleteContact(contactId);
      toast.success('Contact deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete contact');
    }
  };

  const handleExportContacts = async () => {
    try {
      const csvContent = await exportContacts(contactListId, filters);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contacts-${currentContactList?.name}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Contacts exported successfully');
    } catch (error) {
      toast.error('Failed to export contacts');
    }
  };

  const downloadTemplate = () => {
    const csvContent = "phone_number,country_code,first_name,last_name,email,opted_in\n+1234567890,+1,John,Doe,john@example.com,true";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contact_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {currentContactList?.name} - Contact Management
          </DialogTitle>
          <DialogDescription>
            {currentContactList?.total_contacts} total contacts • 
            {currentContactList?.opted_in_count} opted in • 
            {currentContactList?.opted_out_count} opted out
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="view">View Contacts</TabsTrigger>
            <TabsTrigger value="add">Add Contact</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-4">
            {/* Filters and Search */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[300px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select 
                    value={filters.opted_in?.toString() || ''} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, opted_in: value === 'true' }))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Opt-in Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Opted In</SelectItem>
                      <SelectItem value="false">Opted Out</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" onClick={handleExportContacts}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>

                  <Button onClick={loadContacts} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contacts Table */}
            <Card>
              <CardHeader>
                <CardTitle>Contacts ({contacts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        {/* <TableHead>Company</TableHead> */}
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            <p className="text-sm text-muted-foreground mt-2">Loading contacts...</p>
                          </TableCell>
                        </TableRow>
                      ) : editableContacts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-muted-foreground">No contacts found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        editableContacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell className="font-mono">
                              {contact.isEditing ? (
                                <Input
                                  value={contact.tempData?.phone_number || ''}
                                  onChange={(e) => setEditableContacts(prev => 
                                    prev.map(c => c.id === contact.id 
                                      ? { ...c, tempData: { ...c.tempData, phone_number: e.target.value } }
                                      : c
                                    )
                                  )}
                                />
                              ) : (
                                `${contact.country_code} ${contact.phone_number}`
                              )}
                            </TableCell>
                            <TableCell>
                              {contact.isEditing ? (
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="First name"
                                    value={contact.tempData?.first_name || ''}
                                    onChange={(e) => setEditableContacts(prev => 
                                      prev.map(c => c.id === contact.id 
                                        ? { ...c, tempData: { ...c.tempData, first_name: e.target.value } }
                                        : c
                                      )
                                    )}
                                  />
                                  <Input
                                    placeholder="Last name"
                                    value={contact.tempData?.last_name || ''}
                                    onChange={(e) => setEditableContacts(prev => 
                                      prev.map(c => c.id === contact.id 
                                        ? { ...c, tempData: { ...c.tempData, last_name: e.target.value } }
                                        : c
                                      )
                                    )}
                                  />
                                </div>
                              ) : (
                                `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {contact.isEditing ? (
                                <Input
                                  type="email"
                                  value={contact.tempData?.email || ''}
                                  onChange={(e) => setEditableContacts(prev => 
                                    prev.map(c => c.id === contact.id 
                                      ? { ...c, tempData: { ...c.tempData, email: e.target.value } }
                                      : c
                                    )
                                  )}
                                />
                              ) : (
                                contact.email || '-'
                              )}
                            </TableCell>
                            {/* <TableCell>
                              {contact.isEditing ? (
                                <Input
                                  value={contact.tempData?.company || ''}
                                  onChange={(e) => setEditableContacts(prev => 
                                    prev.map(c => c.id === contact.id 
                                      ? { ...c, tempData: { ...c.tempData, company: e.target.value } }
                                      : c
                                    )
                                  )}
                                />
                              ) : (
                                contact.company || '-'
                              )}
                            </TableCell> */}
                            <TableCell>
                              {contact.isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={contact.tempData?.opted_in_count || false}
                                    onCheckedChange={(checked) => setEditableContacts(prev => 
                                      prev.map(c => c.id === contact.id 
                                        ? { ...c, tempData: { ...c.tempData, opted_in_count: checked } }
                                        : c
                                      )
                                    )}
                                  />
                                  <span className="text-sm">{contact.tempData?.opted_in_count ? 'Opted In' : 'Opted Out'}</span>
                                </div>
                              ) : (
                                <Badge variant={contact.opted_in_count ? "default" : "secondary"}>
                                  {contact.opted_in_count ? 'Opted In' : 'Opted Out'}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {contact.isEditing ? (
                                  <>
                                    <Button size="sm" onClick={() => handleSaveContact(contact.id)}>
                                      <Save className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleCancelEdit(contact.id)}>
                                      <CloseIcon className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => handleEditContact(contact.id)}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => handleDeleteContact(contact.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Contact</CardTitle>
                <CardDescription>Add a single contact to this list</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="1234567890"
                      value={newContact.phone_number}
                      onChange={(e) => setNewContact(prev => ({ ...prev, phone_number: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="countryCode">Country Code</Label>
                    <Input
                      id="countryCode"
                      placeholder="+1"
                      value={newContact.country_code}
                      onChange={(e) => setNewContact(prev => ({ ...prev, country_code: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={newContact.first_name}
                      onChange={(e) => setNewContact(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={newContact.last_name}
                      onChange={(e) => setNewContact(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={newContact.email}
                      onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newContact.opted_in_count === 1}
                      onCheckedChange={(checked) => setNewContact(prev => ({ ...prev, opted_in_count: checked ? 1 : 0 }))}
                    />
                    <Label htmlFor="optedIn">Opted In</Label>
                  </div>
                </div>
                <Button onClick={handleAddContact} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Contacts</CardTitle>
                <CardDescription>Import multiple contacts from a CSV file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a CSV file with contact information
                  </p>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="outline" asChild disabled={importing}>
                      <div>
                        {importing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {importing ? 'Importing...' : 'Choose File'}
                      </div>
                    </Button>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={importing}
                    />
                  </Label>
                  <Button variant="outline" onClick={downloadTemplate} className="ml-2">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p><strong>Required column:</strong> phone_number</p>
                  <p><strong>Optional columns:</strong> country_code, first_name, last_name, email, opted_in</p>
                  <p><strong>Format:</strong> CSV with header row</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}