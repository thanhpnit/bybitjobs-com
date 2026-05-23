import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react-native';
import { useNavigate, Navigate } from 'react-router-dom';

const { width } = Dimensions.get('window');

export const Login: React.FC = () => {
  const { colors } = useTheme();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = () => {
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu');
      return;
    }
    
    const success = login(username, password);
    if (!success) {
      setError('Tài khoản hoặc mật khẩu không chính xác');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <View style={[styles.loginBox, { backgroundColor: colors.bgPrimary, borderColor: colors.borderLight }]}>
        <View style={styles.header}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primaryColor }]} />
          <Typography variant="h2" style={{ marginTop: 16 }}>Đăng nhập Quản trị</Typography>
          <Typography variant="body2" color="secondary" style={{ marginTop: 8 }}>
            Hệ thống quản trị BybitJobs
          </Typography>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerBg, borderColor: colors.dangerColor || '#EF4444' }]}>
              <AlertCircle size={16} color={colors.dangerColor || '#EF4444'} />
              <Typography variant="body2" color="danger" style={{ marginLeft: 8 }}>{error}</Typography>
            </View>
          ) : null}

          <Input
            label="Tài khoản"
            placeholder="Nhập tên đăng nhập (VD: admin)"
            value={username}
            onChangeText={(t) => { setUsername(t); setError(''); }}
            autoCapitalize="none"
          />
          
          <Input
            label="Mật khẩu"
            placeholder="Nhập mật khẩu (VD: 123)"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            secureTextEntry
          />

          <Button 
            onPress={handleLogin} 
            icon={<LogIn size={18} color="#fff" />}
            style={{ marginTop: 24, width: '100%', height: 48 }}
          >
            Đăng nhập hệ thống
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  loginBox: {
    width: Math.min(width - 32, 400),
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  form: {
    width: '100%',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  }
});
