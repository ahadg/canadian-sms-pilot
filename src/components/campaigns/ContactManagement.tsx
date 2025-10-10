// components/ContactManagement.tsx
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Users, Edit, Trash2, FileText, Loader2 } from "lucide-react";
import { useContactStore } from "@/store/useContactStore";
import { ContactManager } from "./ContactManager";
import { contactAPI } from "@/lib/api/contacts";
import { toast } from "sonner";

export function ContactManagement() {
  const {
    contactLists,
    deleteContactList,
    refreshContactLists,
    loading
  } = useContactStore();

  const [isCreateContactListOpen, setIsCreateContactListOpen] = useState(false);
  const [isContactManagerOpen, setIsContactManagerOpen] = useState(false);
  const [selectedContactListId, setSelectedContactListId] = useState<string | null>(null);
  const [contactListName, setContactListName] = useState('');

  // Load contact lists when component mounts
  useEffect(() => {
    refreshContactLists();
  }, []); // Empty dependency array to run only once

  // Create contact list handler
  const handleCreateContactList = async () => {
    if (!contactListName.trim()) {
      toast.error('Please enter a contact list name');
      return;
    }

    try {
      await contactAPI.createList({ name: contactListName });
      await refreshContactLists();
      setIsCreateContactListOpen(false);
      setContactListName('');
      toast.success('Contact list created successfully');
    } catch (error) {
      console.error('Error creating contact list:', error);
      toast.error('Failed to create contact list');
    }
  };

  const handleDeleteContactList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this contact list? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteContactList(listId);
      toast.success('Contact list deleted successfully');
    } catch (error) {
      console.error('Error deleting contact list:', error);
      toast.error('Failed to delete contact list');
    }
  };

  const handleOpenContactManager = (listId: string) => {
    setSelectedContactListId(listId);
    setIsContactManagerOpen(true);
  };

  if (loading && contactLists.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contact Lists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contact Lists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contactLists.map((list) => (
              <Card key={list._id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium">{list.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(list.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Opted In</span>
                        <span>{list.optedInCount}/{list.totalContacts}</span>
                      </div>
                      <Progress value={list.totalContacts > 0 ? (list.optedInCount / list.totalContacts) * 100 : 0} />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleOpenContactManager(list._id)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteContactList(list._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New List Card */}
            <Dialog open={isCreateContactListOpen} onOpenChange={setIsCreateContactListOpen}>
              <DialogTrigger asChild>
                <Card className="border-dashed cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-center min-h-[200px]">
                    <div className="text-center">
                      <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">Create new contact list</p>
                      <Button variant="outline" size="sm">
                        Add List
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Contact List</DialogTitle>
                  <DialogDescription>
                    Create a new contact list to organize your contacts
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="listName">List Name</Label>
                    <Input 
                      id="listName" 
                      placeholder="Enter list name"
                      value={contactListName}
                      onChange={(e) => setContactListName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setIsCreateContactListOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleCreateContactList}>
                      Create List
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Contact Manager Dialog */}
      {selectedContactListId && (
        <ContactManager
          contactListId={selectedContactListId}
          open={isContactManagerOpen}
          onOpenChange={setIsContactManagerOpen}
        />
      )}
    </div>
  );
}