-- Enable realtime for collaborations table
ALTER TABLE public.collaborations REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.collaborations;

-- Enable realtime for messages table  
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.messages;