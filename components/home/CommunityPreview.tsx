import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { CommunityService, type CommunityPost } from '../../services/communityService';

export function CommunityPreview() {
  const { theme } = useTheme();
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    let active = true;
    CommunityService.getRecentRealPosts(2).then(items => { if (active) setPosts(items); }).catch(() => {});
    return () => { active = false; };
  }, []);

  return <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>Comunidade</Text>
      <TouchableOpacity onPress={() => router.push('/(tabs)/feed')} accessibilityLabel="Abrir comunidade" style={{ paddingVertical: 8 }}>
        <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700' }}>Ver feed →</Text>
      </TouchableOpacity>
    </View>
    {posts.length ? posts.map(post => <TouchableOpacity key={post.id} onPress={() => router.push('/(tabs)/feed')}
      style={{ flexDirection: 'row', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.primary + '24', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{post.userName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700' }}>{post.userName} <Text style={{ color: theme.colors.textMuted, fontWeight: '400' }}>· {post.category}</Text></Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 }} numberOfLines={2}>{post.content}</Text>
      </View>
    </TouchableOpacity>) : <TouchableOpacity onPress={() => router.push('/(tabs)/feed')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
      <Ionicons name="chatbubbles-outline" size={21} color={theme.colors.primary} />
      <Text style={{ color: theme.colors.textSecondary, fontSize: 12, flex: 1 }}>Ainda não há mensagens reais recentes. Participe da conversa.</Text>
    </TouchableOpacity>}
  </View>;
}
